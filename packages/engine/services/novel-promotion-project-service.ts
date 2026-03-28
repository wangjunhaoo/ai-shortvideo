import { prisma } from '@engine/prisma'
import { logProjectAction } from '@/lib/logging/semantic'
import { logError as _ulogError } from '@/lib/logging/core'
import { ApiError } from '@/lib/api-errors'
import { isArtStyleValue } from '@/lib/constants'
import { detectEpisodeMarkers, splitByMarkers } from '@/lib/episode-marker-detector'
import { attachMediaFieldsToProject } from '@/lib/media/attach'
import { resolveMediaRefFromLegacyValue } from '@/lib/media/service'
import { Prisma } from '@prisma/client'
import {
  parseModelKeyStrict,
  type CapabilitySelections,
  type UnifiedModelType} from '@core/model-config-contract'
import {
  resolveBuiltinModelContext,
  getCapabilityOptionFields,
  validateCapabilitySelectionsPayload,
  type CapabilityModelContext} from '@core/model-capabilities/lookup'

const MODEL_FIELDS = [
  'analysisModel',
  'characterModel',
  'locationModel',
  'storyboardModel',
  'editModel',
  'videoModel',
  'audioModel',
] as const

const MODEL_FIELD_TO_TYPE: Record<typeof MODEL_FIELDS[number], UnifiedModelType> = {
  analysisModel: 'llm',
  characterModel: 'image',
  locationModel: 'image',
  storyboardModel: 'image',
  editModel: 'image',
  videoModel: 'video',
  audioModel: 'audio',
}

const CAPABILITY_MODEL_TYPES: readonly UnifiedModelType[] = ['image', 'video', 'llm', 'audio', 'lipsync']

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function normalizeCapabilitySelectionsInput(
  raw: unknown,
  options?: { allowLegacyAspectRatio?: boolean },
): CapabilitySelections {
  if (raw === undefined || raw === null) return {}
  if (!isRecord(raw)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'CAPABILITY_SELECTION_INVALID',
      field: 'capabilityOverrides'})
  }

  const normalized: CapabilitySelections = {}
  for (const [modelKey, rawSelection] of Object.entries(raw)) {
    if (!isRecord(rawSelection)) {
      throw new ApiError('INVALID_PARAMS', {
        code: 'CAPABILITY_SELECTION_INVALID',
        field: `capabilityOverrides.${modelKey}`})
    }

    const selection: Record<string, string | number | boolean> = {}
    for (const [field, value] of Object.entries(rawSelection)) {
      if (field === 'aspectRatio') {
        if (options?.allowLegacyAspectRatio) continue
        throw new ApiError('INVALID_PARAMS', {
          code: 'CAPABILITY_FIELD_INVALID',
          field: `capabilityOverrides.${modelKey}.${field}`})
      }
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        throw new ApiError('INVALID_PARAMS', {
          code: 'CAPABILITY_SELECTION_INVALID',
          field: `capabilityOverrides.${modelKey}.${field}`})
      }
      selection[field] = value
    }

    if (Object.keys(selection).length > 0) {
      normalized[modelKey] = selection
    }
  }

  return normalized
}

function parseStoredCapabilitySelections(raw: string | null | undefined): CapabilitySelections {
  if (!raw) return {}
  try {
    return normalizeCapabilitySelectionsInput(JSON.parse(raw) as unknown, { allowLegacyAspectRatio: true })
  } catch {
    return {}
  }
}

function serializeCapabilitySelections(selections: CapabilitySelections): string | null {
  if (Object.keys(selections).length === 0) return null
  return JSON.stringify(selections)
}

function validateModelKeyField(field: typeof MODEL_FIELDS[number], value: unknown) {
  // Contract anchor: model key must be provider::modelId
  if (value === null) return
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'MODEL_KEY_INVALID',
      field})
  }
  if (!parseModelKeyStrict(value)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'MODEL_KEY_INVALID',
      field})
  }
}

function validateArtStyleField(value: unknown): string {
  if (typeof value !== 'string') {
    throw new ApiError('INVALID_PARAMS', {
      code: 'INVALID_ART_STYLE',
      field: 'artStyle',
      message: 'artStyle must be a supported value',
    })
  }
  const artStyle = value.trim()
  if (!isArtStyleValue(artStyle)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'INVALID_ART_STYLE',
      field: 'artStyle',
      message: 'artStyle must be a supported value',
    })
  }
  return artStyle
}

function getNextProjectModelMap(
  current: {
    analysisModel: string | null
    characterModel: string | null
    locationModel: string | null
    storyboardModel: string | null
    editModel: string | null
    videoModel: string | null
    audioModel: string | null
  },
  updates: Record<string, unknown>,
): Record<string, CapabilityModelContext> {
  const nextMap = new Map<string, CapabilityModelContext>()

  for (const field of MODEL_FIELDS) {
    const rawValue = updates[field] !== undefined
      ? updates[field]
      : current[field]
    if (typeof rawValue !== 'string' || !rawValue.trim()) continue

    const modelKey = rawValue.trim()
    const context = resolveBuiltinModelContext(MODEL_FIELD_TO_TYPE[field], modelKey)
    if (!context) continue
    nextMap.set(modelKey, context)
  }

  return Object.fromEntries(nextMap)
}

function resolveCapabilityContext(
  modelKey: string,
  modelContextMap: Record<string, CapabilityModelContext>,
): CapabilityModelContext | null {
  const fromProjectModel = modelContextMap[modelKey]
  if (fromProjectModel) return fromProjectModel
  if (!parseModelKeyStrict(modelKey)) return null

  for (const modelType of CAPABILITY_MODEL_TYPES) {
    const context = resolveBuiltinModelContext(modelType, modelKey)
    if (context) return context
  }

  return null
}

function sanitizeCapabilityOverrides(
  overrides: CapabilitySelections,
  modelContextMap: Record<string, CapabilityModelContext>,
): CapabilitySelections {
  const sanitized: CapabilitySelections = {}

  for (const [modelKey, selection] of Object.entries(overrides)) {
    const context = resolveCapabilityContext(modelKey, modelContextMap)
    if (!context) continue

    const optionFields = getCapabilityOptionFields(context.modelType, context.capabilities)
    if (Object.keys(optionFields).length === 0) continue

    const cleanedSelection: Record<string, string | number | boolean> = {}
    for (const [field, value] of Object.entries(selection)) {
      const allowedValues = optionFields[field]
      if (!allowedValues) continue
      if (!allowedValues.includes(value)) continue
      cleanedSelection[field] = value
    }

    if (Object.keys(cleanedSelection).length > 0) {
      sanitized[modelKey] = cleanedSelection
    }
  }

  return sanitized
}

function validateCapabilityOverrides(
  overrides: CapabilitySelections,
  modelContextMap: Record<string, CapabilityModelContext>,
) {
  const issues = validateCapabilitySelectionsPayload(overrides, (modelKey) =>
    resolveCapabilityContext(modelKey, modelContextMap))

  if (issues.length > 0) {
    const firstIssue = issues[0]
    throw new ApiError('INVALID_PARAMS', {
      code: firstIssue.code,
      field: firstIssue.field,
      allowedValues: firstIssue.allowedValues})
  }
}

export async function getNovelPromotionProjectCapabilityOverrides(projectId: string) {
  const projectData = await prisma.novelPromotionProject.findUnique({
    where: { projectId },
    select: {
      capabilityOverrides: true,
      analysisModel: true,
      characterModel: true,
      locationModel: true,
      storyboardModel: true,
      editModel: true,
      videoModel: true,
      audioModel: true,
    }})

  const storedOverrides = parseStoredCapabilitySelections(projectData?.capabilityOverrides)
  const modelContextMap = projectData
    ? getNextProjectModelMap({
      analysisModel: projectData.analysisModel,
      characterModel: projectData.characterModel,
      locationModel: projectData.locationModel,
      storyboardModel: projectData.storyboardModel,
      editModel: projectData.editModel,
      videoModel: projectData.videoModel,
      audioModel: projectData.audioModel,
    }, {})
    : {}
  const cleanedOverrides = sanitizeCapabilityOverrides(storedOverrides, modelContextMap)

  return {
    capabilityOverrides: cleanedOverrides,
  }
}

export async function splitNovelPromotionEpisodesByMarkers(input: {
  projectId: string
  userId: string
  username: string
  content: string
}) {
  if (!input.content || typeof input.content !== 'string') {
    throw new ApiError('INVALID_PARAMS')
  }

  if (input.content.length < 100) {
    throw new ApiError('INVALID_PARAMS')
  }

  const project = await prisma.novelPromotionProject.findFirst({
    where: { projectId: input.projectId },
    include: { project: true },
  })
  if (!project) {
    throw new ApiError('NOT_FOUND')
  }

  const markerResult = detectEpisodeMarkers(input.content)
  if (!markerResult.hasMarkers || markerResult.matches.length < 2) {
    throw new ApiError('INVALID_PARAMS')
  }

  const episodes = splitByMarkers(input.content, markerResult)
  const projectName = project.project?.name || input.projectId

  logProjectAction(
    'EPISODE_SPLIT_BY_MARKERS',
    `标识符分集完成 - ${episodes.length} 集，标记类型: ${markerResult.markerType}`,
    {
      markerType: markerResult.markerType,
      confidence: markerResult.confidence,
      episodeCount: episodes.length,
      totalWords: episodes.reduce((sum, episode) => sum + episode.wordCount, 0),
    },
    input.userId,
    input.username,
    input.projectId,
    projectName,
  )

  return {
    success: true,
    method: 'markers',
    markerType: markerResult.markerType,
    episodes,
  }
}

export async function updateNovelPromotionProjectConfig(input: {
  projectId: string
  userId: string
  userName?: string | null
  project: Record<string, unknown> & {
    name: string
  }
  body: Record<string, unknown>
}) {
  const { projectId, userId, userName, project, body } = input
  if (project.mode !== 'novel-promotion') {
    throw new ApiError('INVALID_PARAMS')
  }

  const currentProjectConfig = await prisma.novelPromotionProject.findUnique({
    where: { projectId },
    select: {
      analysisModel: true,
      characterModel: true,
      locationModel: true,
      storyboardModel: true,
      editModel: true,
      videoModel: true,
      audioModel: true,
    }})
  if (!currentProjectConfig) {
    throw new ApiError('NOT_FOUND')
  }

  const allowedProjectFields = [
    'analysisModel', 'characterModel', 'locationModel', 'storyboardModel',
    'editModel', 'videoModel', 'audioModel', 'videoRatio', 'artStyle',
    'ttsRate', 'lipSyncEnabled', 'lipSyncMode', 'capabilityOverrides',
  ] as const

  const updateData: Record<string, unknown> = {}
  for (const field of allowedProjectFields) {
    if (body[field] === undefined) continue

    if ((MODEL_FIELDS as readonly string[]).includes(field)) {
      validateModelKeyField(field as typeof MODEL_FIELDS[number], body[field])
    }

    if (field === 'artStyle') {
      updateData[field] = validateArtStyleField(body[field])
      continue
    }

    if (field === 'capabilityOverrides') {
      const overrides = normalizeCapabilitySelectionsInput(body.capabilityOverrides)
      const modelContextMap = getNextProjectModelMap(currentProjectConfig, body as Record<string, unknown>)
      const cleanedOverrides = sanitizeCapabilityOverrides(overrides, modelContextMap)
      validateCapabilityOverrides(cleanedOverrides, modelContextMap)
      updateData.capabilityOverrides = serializeCapabilitySelections(cleanedOverrides)
      continue
    }

    updateData[field] = body[field]
  }

  const updatedNovelPromotionData = await prisma.novelPromotionProject.update({
    where: { projectId },
    data: updateData})

  const novelPromotionDataWithSignedUrls = await attachMediaFieldsToProject(updatedNovelPromotionData)

  const fullProject = {
    ...project,
    novelPromotionData: novelPromotionDataWithSignedUrls,
  }

  logProjectAction(
    'UPDATE_NOVEL_PROMOTION',
    userId,
    userName,
    projectId,
    project.name,
    JSON.stringify({ changes: body }),
  )

  return { project: fullProject }
}

export async function getNovelPromotionProjectAssets(projectId: string) {
  const novelData = await prisma.novelPromotionProject.findUnique({
    where: { projectId },
    include: {
      characters: {
        include: {
          appearances: {
            orderBy: { appearanceIndex: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      locations: {
        include: {
          images: {
            orderBy: { imageIndex: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!novelData) {
    return { characters: [], locations: [] }
  }

  const withSignedUrls = await attachMediaFieldsToProject(novelData)

  return {
    characters: withSignedUrls.characters || [],
    locations: withSignedUrls.locations || [],
  }
}

export async function getVideoEditorProjectByEpisodeId(episodeId: string) {
  const editorProject = await prisma.videoEditorProject.findUnique({
    where: { episodeId },
  })

  if (!editorProject) {
    return { projectData: null }
  }

  return {
    id: editorProject.id,
    episodeId: editorProject.episodeId,
    projectData: JSON.parse(editorProject.projectData),
    renderStatus: editorProject.renderStatus,
    outputUrl: editorProject.outputUrl,
    updatedAt: editorProject.updatedAt,
  }
}

export async function upsertVideoEditorProject(input: {
  projectId: string
  episodeId: string
  projectData: unknown
}) {
  const { projectId, episodeId, projectData } = input

  const episode = await prisma.novelPromotionEpisode.findFirst({
    where: {
      id: episodeId,
      novelPromotionProject: { projectId },
    },
    select: { id: true },
  })

  if (!episode) {
    throw new ApiError('NOT_FOUND')
  }

  const editorProject = await prisma.videoEditorProject.upsert({
    where: { episodeId },
    create: {
      episodeId,
      projectData: JSON.stringify(projectData),
    },
    update: {
      projectData: JSON.stringify(projectData),
      updatedAt: new Date(),
    },
  })

  return {
    success: true,
    id: editorProject.id,
    updatedAt: editorProject.updatedAt,
  }
}

export async function deleteVideoEditorProjectByEpisodeId(episodeId: string) {
  await prisma.videoEditorProject.delete({
    where: { episodeId },
  })

  return { success: true }
}

export async function listNovelPromotionEpisodes(novelPromotionProjectId: string) {
  const episodes = await prisma.novelPromotionEpisode.findMany({
    where: { novelPromotionProjectId },
    orderBy: { episodeNumber: 'asc' },
  })

  return { episodes }
}

export async function createNovelPromotionEpisode(input: {
  novelPromotionProjectId: string
  name: string
  description?: string | null
}) {
  const name = input.name.trim()
  if (!name) {
    throw new ApiError('INVALID_PARAMS')
  }

  const lastEpisode = await prisma.novelPromotionEpisode.findFirst({
    where: { novelPromotionProjectId: input.novelPromotionProjectId },
    orderBy: { episodeNumber: 'desc' },
  })
  const nextEpisodeNumber = (lastEpisode?.episodeNumber || 0) + 1

  const episode = await prisma.novelPromotionEpisode.create({
    data: {
      novelPromotionProjectId: input.novelPromotionProjectId,
      episodeNumber: nextEpisodeNumber,
      name,
      description: input.description?.trim() || null,
    },
  })

  await prisma.novelPromotionProject.update({
    where: { id: input.novelPromotionProjectId },
    data: { lastEpisodeId: episode.id },
  })

  return { episode }
}

export async function createNovelPromotionEpisodesBatch(input: {
  projectId: string
  episodes: Array<{
    name: string
    description?: string
    novelText: string
  }>
  clearExisting?: boolean
  importStatus?: string
}) {
  const project = await prisma.novelPromotionProject.findFirst({
    where: { projectId: input.projectId },
  })

  if (!project) {
    throw new ApiError('NOT_FOUND')
  }

  const clearExisting = input.clearExisting === true

  if (clearExisting) {
    await prisma.novelPromotionEpisode.deleteMany({
      where: { novelPromotionProjectId: project.id },
    })
  }

  if (input.episodes.length === 0) {
    if (input.importStatus) {
      await prisma.novelPromotionProject.update({
        where: { id: project.id },
        data: { importStatus: input.importStatus },
      })
    }

    return {
      success: true,
      episodes: [],
      message: '已清空剧集',
    }
  }

  const lastEpisode = await prisma.novelPromotionEpisode.findFirst({
    where: { novelPromotionProjectId: project.id },
    orderBy: { episodeNumber: 'desc' },
  })
  const startNumber = clearExisting ? 1 : (lastEpisode?.episodeNumber || 0) + 1

  const createdEpisodes = await prisma.$transaction(
    input.episodes.map((episode, index) =>
      prisma.novelPromotionEpisode.create({
        data: {
          novelPromotionProjectId: project.id,
          episodeNumber: startNumber + index,
          name: episode.name,
          description: episode.description || null,
          novelText: episode.novelText,
        },
      }),
    ),
  )

  const updateData: { lastEpisodeId: string; importStatus?: string } = {
    lastEpisodeId: createdEpisodes[0].id,
  }
  if (input.importStatus) {
    updateData.importStatus = input.importStatus
  }

  await prisma.novelPromotionProject.update({
    where: { id: project.id },
    data: updateData,
  })

  return {
    success: true,
    episodes: createdEpisodes.map((episode) => ({
      id: episode.id,
      episodeNumber: episode.episodeNumber,
      name: episode.name,
    })),
  }
}

export async function getNovelPromotionEpisodeDetail(input: {
  projectId: string
  episodeId: string
}) {
  const episode = await prisma.novelPromotionEpisode.findUnique({
    where: { id: input.episodeId },
    include: {
      clips: {
        orderBy: { createdAt: 'asc' },
      },
      storyboards: {
        include: {
          clip: true,
          panels: { orderBy: { panelIndex: 'asc' } },
        },
        orderBy: { createdAt: 'asc' },
      },
      shots: {
        orderBy: { shotId: 'asc' },
      },
      voiceLines: {
        orderBy: { lineIndex: 'asc' },
      },
    },
  })

  if (!episode) {
    throw new ApiError('NOT_FOUND')
  }

  prisma.novelPromotionProject.update({
    where: { projectId: input.projectId },
    data: { lastEpisodeId: input.episodeId },
  }).catch((error) => _ulogError('更新 lastEpisodeId 失败:', error))

  const episodeWithSignedUrls = await attachMediaFieldsToProject(episode)
  return { episode: episodeWithSignedUrls }
}

export async function updateNovelPromotionEpisode(input: {
  episodeId: string
  body: Record<string, unknown>
}) {
  const { name, description, novelText, audioUrl, srtContent } = input.body
  const updateData: Prisma.NovelPromotionEpisodeUncheckedUpdateInput = {}

  if (name !== undefined) updateData.name = String(name).trim()
  if (description !== undefined) updateData.description = typeof description === 'string' ? description.trim() : null
  if (novelText !== undefined) updateData.novelText = typeof novelText === 'string' ? novelText : null
  if (audioUrl !== undefined) {
    updateData.audioUrl = typeof audioUrl === 'string' ? audioUrl : null
    const media = await resolveMediaRefFromLegacyValue(audioUrl)
    updateData.audioMediaId = media?.id || null
  }
  if (srtContent !== undefined) updateData.srtContent = typeof srtContent === 'string' ? srtContent : null

  const episode = await prisma.novelPromotionEpisode.update({
    where: { id: input.episodeId },
    data: updateData,
  })

  return { episode }
}

export async function deleteNovelPromotionEpisode(input: {
  projectId: string
  episodeId: string
}) {
  await prisma.novelPromotionEpisode.delete({
    where: { id: input.episodeId },
  })

  const novelPromotionProject = await prisma.novelPromotionProject.findUnique({
    where: { projectId: input.projectId },
  })

  if (novelPromotionProject?.lastEpisodeId === input.episodeId) {
    const anotherEpisode = await prisma.novelPromotionEpisode.findFirst({
      where: { novelPromotionProjectId: novelPromotionProject.id },
      orderBy: { episodeNumber: 'asc' },
    })

    await prisma.novelPromotionProject.update({
      where: { id: novelPromotionProject.id },
      data: { lastEpisodeId: anotherEpisode?.id || null },
    })
  }

  return { success: true }
}



