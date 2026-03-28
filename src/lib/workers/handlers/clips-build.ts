import { createTaskExecutionContext, type WorkerTaskJob } from '@engine/runtime-context'
import { safeParseJsonArray } from '@/lib/json-repair'
import { executeAiTextStep } from '@/lib/ai-runtime'
import { withInternalLLMStreamCallbacks } from '@/lib/llm-observe/internal-stream-context'
import { buildCharactersIntroduction } from '@/lib/constants'
import { createClipContentMatcher } from '@/lib/novel-promotion/story-to-script/clip-matching'
import { reportTaskProgress } from '@/lib/workers/shared'
import { assertTaskActive } from '@/lib/workers/utils'
import { createWorkerLLMStreamCallbacks, createWorkerLLMStreamContext } from './llm-stream'
import { buildPrompt, PROMPT_IDS } from '@core/prompt-i18n'
import { resolveAnalysisModel } from './resolve-analysis-model'

function parseClipArrayResponse(responseText: string): Array<Record<string, unknown>> {
  return safeParseJsonArray(responseText, 'clips')
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

const MAX_SPLIT_BOUNDARY_ATTEMPTS = 2
const CLIP_BOUNDARY_SUFFIX = `

[Boundary Constraints]
1. The "start" and "end" anchors must come from the original text and be locatable.
2. Allow punctuation/whitespace differences, but do not rewrite key entities or events.
3. If anchors cannot be located reliably, return [] directly.`

export async function handleClipsBuildTask(job: WorkerTaskJob) {
  const context = createTaskExecutionContext(job)
  const projectRepository = context.repositories.project
  const userPreferenceRepository = context.repositories.userPreference
  const payload = (job.data.payload || {}) as Record<string, unknown>
  const projectId = job.data.projectId
  const episodeId = readText(payload.episodeId || job.data.episodeId).trim()
  if (!episodeId) {
    throw new Error('episodeId is required')
  }

  const project = await projectRepository.getProjectMode(projectId)
  if (!project) {
    throw new Error('Project not found')
  }
  if (project.mode !== 'novel-promotion') {
    throw new Error('Not a novel promotion project')
  }

  const novelData = await projectRepository.getNovelProjectForAnalysis(projectId)
  if (!novelData) {
    throw new Error('Novel promotion data not found')
  }
  const analysisModel = await resolveAnalysisModel({
    userId: job.data.userId,
    inputModel: payload.model,
    projectAnalysisModel: novelData.analysisModel,
    userPreferenceRepository,
  })

  const episode = await projectRepository.getEpisodeForClipBuild(episodeId)
  if (!episode) {
    throw new Error('Episode not found')
  }
  if (episode.novelPromotionProjectId !== novelData.id) {
    throw new Error('Episode does not belong to this project')
  }

  const contentToProcess = readText(episode.novelText)
  if (!contentToProcess.trim()) {
    throw new Error('No novel text to process')
  }

  const locationsLibName = novelData.locations.length > 0
    ? novelData.locations.map((item) => item.name).join('、')
    : '无'
  const charactersLibName = novelData.characters.length > 0
    ? novelData.characters.map((item) => item.name).join('、')
    : '无'
  const charactersIntroduction = buildCharactersIntroduction(novelData.characters)
  const promptTemplateBase = buildPrompt({
    promptId: PROMPT_IDS.NP_AGENT_CLIP,
    locale: job.data.locale,
    variables: {
      input: contentToProcess,
      locations_lib_name: locationsLibName,
      characters_lib_name: charactersLibName,
      characters_introduction: charactersIntroduction,
    },
  })
  const promptTemplate = `${promptTemplateBase}${CLIP_BOUNDARY_SUFFIX}`

  await reportTaskProgress(job, 20, {
    stage: 'clips_build_prepare',
    stageLabel: '准备片段切分参数',
    displayMode: 'detail',
  })
  await assertTaskActive(job, 'clips_build_prepare')

  const streamContext = createWorkerLLMStreamContext(job, 'clips_build')
  const streamCallbacks = createWorkerLLMStreamCallbacks(job, streamContext)
  const resolvedClips: Array<{
    startText: string
    endText: string
    summary: string
    location: string | null
    characters: unknown
    content: string
  }> = []
  let lastBoundaryError: Error | null = null

  try {
    for (let attempt = 1; attempt <= MAX_SPLIT_BOUNDARY_ATTEMPTS; attempt += 1) {
      const completion = await withInternalLLMStreamCallbacks(
        streamCallbacks,
        async () =>
          await executeAiTextStep({
            userId: job.data.userId,
            model: analysisModel,
            messages: [{ role: 'user', content: promptTemplate }],
            projectId,
            action: 'split_clips',
            meta: {
              stepId: 'split_clips',
              stepAttempt: attempt,
              stepTitle: '片段切分',
              stepIndex: 1,
              stepTotal: 1,
            },
          }),
      )

      const responseText = completion.text
      if (!responseText) {
        lastBoundaryError = new Error('No response from AI')
        continue
      }

      const parsed = parseClipArrayResponse(responseText)
      if (parsed.length === 0) {
        lastBoundaryError = new Error('Invalid clips data structure')
        continue
      }

      const matcher = createClipContentMatcher(contentToProcess)
      const currentResolved: typeof resolvedClips = []
      let searchFrom = 0
      let failedAt: { index: number; startText: string; endText: string } | null = null
      for (let i = 0; i < parsed.length; i += 1) {
        const clipData = parsed[i]
        const startText = readText(clipData.start)
        const endText = readText(clipData.end)
        const match = matcher.matchBoundary(startText, endText, searchFrom)
        if (!match) {
          failedAt = { index: i + 1, startText, endText }
          break
        }
        currentResolved.push({
          startText,
          endText,
          summary: readText(clipData.summary),
          location: readText(clipData.location) || null,
          characters: clipData.characters,
          content: contentToProcess.slice(match.startIndex, match.endIndex),
        })
        searchFrom = match.endIndex
      }

      if (!failedAt) {
        resolvedClips.push(...currentResolved)
        break
      }

      lastBoundaryError = new Error(
        `split_clips boundary matching failed at clip_${failedAt.index}: start="${failedAt.startText}" end="${failedAt.endText}"`,
      )
    }
  } finally {
    await streamCallbacks.flush()
  }

  if (resolvedClips.length === 0) {
    throw lastBoundaryError || new Error('split_clips boundary matching failed')
  }

  await reportTaskProgress(job, 75, {
    stage: 'clips_build_persist',
    stageLabel: '保存片段切分结果',
    displayMode: 'detail',
  })
  await assertTaskActive(job, 'clips_build_persist')

  const createdClips = await projectRepository.saveClipsForEpisode(episodeId, resolvedClips)

  await reportTaskProgress(job, 96, {
    stage: 'clips_build_done',
    stageLabel: '片段切分已完成',
    displayMode: 'detail',
  })

  return {
    episodeId,
    count: createdClips.length,
  }
}




