import { createHash } from 'crypto'
import { ApiError } from '@/lib/api-errors'
import { normalizeImageGenerationCount } from '@/lib/image-generation/count'
import { maybeSubmitLLMTask } from '@/lib/llm-observe/route-task'
import { TASK_TYPE, type TaskType } from '@/lib/task/types'
import { getProjectModelConfig } from '@engine/config-service'
import { isErrorResponse, requireProjectAuth, requireProjectAuthLight } from '@engine/api-auth'

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function readTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function ensureNovelPromotionMode(mode: unknown) {
  if (typeof mode !== 'string' || mode !== 'novel-promotion') {
    throw new ApiError('INVALID_PARAMS')
  }
}

function parseReferenceImages(body: Record<string, unknown>): string[] {
  const list = Array.isArray(body.referenceImageUrls)
    ? body.referenceImageUrls
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    : []
  if (list.length > 0) return list.slice(0, 5)
  const single = readTrimmedString(body.referenceImageUrl)
  return single ? [single] : []
}

async function ensureMaybeSubmitTaskOrThrow(input: {
  request: Request
  userId: string
  projectId: string
  episodeId?: string | null
  type: TaskType
  targetType: string
  targetId: string
  routePath: string
  body: Record<string, unknown>
  dedupeKey: string
  priority?: number
}) {
  const response = await maybeSubmitLLMTask(input)
  if (response) return response
  throw new ApiError('INVALID_PARAMS')
}

export async function handleNovelPromotionAiCreateCharacterRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireProjectAuth(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const userInstruction = readTrimmedString(body.userInstruction)
  if (!userInstruction) {
    throw new ApiError('INVALID_PARAMS')
  }

  const modelConfig = await getProjectModelConfig(projectId, session.user.id)
  if (!modelConfig.analysisModel) {
    throw new ApiError('MISSING_CONFIG')
  }

  const dedupeDigest = createHash('sha1')
    .update(`${projectId}:${session.user.id}:character:${userInstruction}`)
    .digest('hex')
    .slice(0, 16)

  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    type: TASK_TYPE.AI_CREATE_CHARACTER,
    targetType: 'NovelPromotionCharacterDesign',
    targetId: projectId,
    routePath: `/api/novel-promotion/${projectId}/ai-create-character`,
    body: {
      userInstruction,
      analysisModel: modelConfig.analysisModel,
      displayMode: 'detail',
    },
    dedupeKey: `novel_promotion_ai_create_character:${dedupeDigest}`,
  })
}

export async function handleNovelPromotionAiCreateLocationRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireProjectAuth(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const userInstruction = readTrimmedString(body.userInstruction)
  if (!userInstruction) {
    throw new ApiError('INVALID_PARAMS')
  }

  const modelConfig = await getProjectModelConfig(projectId, session.user.id)
  if (!modelConfig.analysisModel) {
    throw new ApiError('MISSING_CONFIG')
  }

  const dedupeDigest = createHash('sha1')
    .update(`${projectId}:${session.user.id}:location:${userInstruction}`)
    .digest('hex')
    .slice(0, 16)

  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    type: TASK_TYPE.AI_CREATE_LOCATION,
    targetType: 'NovelPromotionLocationDesign',
    targetId: projectId,
    routePath: `/api/novel-promotion/${projectId}/ai-create-location`,
    body: {
      userInstruction,
      analysisModel: modelConfig.analysisModel,
      displayMode: 'detail',
    },
    dedupeKey: `novel_promotion_ai_create_location:${dedupeDigest}`,
  })
}

export async function handleNovelPromotionAiModifyAppearanceRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireProjectAuth(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const characterId = readTrimmedString(body.characterId)
  const appearanceId = readTrimmedString(body.appearanceId)
  const currentDescription = readTrimmedString(body.currentDescription)
  const modifyInstruction = readTrimmedString(body.modifyInstruction)
  if (!characterId || !appearanceId || !currentDescription || !modifyInstruction) {
    throw new ApiError('INVALID_PARAMS')
  }

  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    type: TASK_TYPE.AI_MODIFY_APPEARANCE,
    targetType: 'CharacterAppearance',
    targetId: appearanceId,
    routePath: `/api/novel-promotion/${projectId}/ai-modify-appearance`,
    body,
    dedupeKey: `ai_modify_appearance:${appearanceId}`,
  })
}

export async function handleNovelPromotionAiModifyLocationRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireProjectAuth(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const locationId = readTrimmedString(body.locationId)
  const currentDescription = readTrimmedString(body.currentDescription)
  const modifyInstruction = readTrimmedString(body.modifyInstruction)
  const imageIndexValue = Number(body.imageIndex ?? 0)
  const imageIndex = Number.isFinite(imageIndexValue) ? Math.max(0, Math.floor(imageIndexValue)) : 0
  if (!locationId || !currentDescription || !modifyInstruction) {
    throw new ApiError('INVALID_PARAMS')
  }

  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    type: TASK_TYPE.AI_MODIFY_LOCATION,
    targetType: 'NovelPromotionLocation',
    targetId: locationId,
    routePath: `/api/novel-promotion/${projectId}/ai-modify-location`,
    body: {
      ...body,
      imageIndex,
    },
    dedupeKey: `ai_modify_location:${locationId}:${imageIndex}`,
  })
}

export async function handleNovelPromotionAiModifyShotPromptRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireProjectAuth(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { session, project } = authResult
  ensureNovelPromotionMode(project.mode)

  const body = toRecord(await request.json().catch(() => ({})))
  const currentPrompt = readTrimmedString(body.currentPrompt)
  const modifyInstruction = readTrimmedString(body.modifyInstruction)
  if (!currentPrompt || !modifyInstruction) {
    throw new ApiError('INVALID_PARAMS')
  }

  const panelId = readTrimmedString(body.panelId)
  const episodeId = readTrimmedString(body.episodeId)

  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    episodeId: episodeId || null,
    type: TASK_TYPE.AI_MODIFY_SHOT_PROMPT,
    targetType: panelId ? 'NovelPromotionPanel' : 'NovelPromotionProject',
    targetId: panelId || projectId,
    routePath: `/api/novel-promotion/${projectId}/ai-modify-shot-prompt`,
    body,
    dedupeKey: panelId ? `ai_modify_shot_prompt:${panelId}` : `ai_modify_shot_prompt:${projectId}`,
  })
}

export async function handleNovelPromotionAnalyzeRequest(
  request: Request,
  projectId: string,
) {
  const body = toRecord(await request.json().catch(() => ({})))
  const episodeId = readTrimmedString(body.episodeId)

  const authResult = await requireProjectAuth(projectId, {
    include: { characters: true, locations: true },
  })
  if (isErrorResponse(authResult)) return authResult
  const { session, project } = authResult
  ensureNovelPromotionMode(project.mode)

  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    episodeId: episodeId || null,
    type: TASK_TYPE.ANALYZE_NOVEL,
    targetType: 'NovelPromotionProject',
    targetId: projectId,
    routePath: `/api/novel-promotion/${projectId}/analyze`,
    body: {
      ...body,
      displayMode: 'detail',
    },
    dedupeKey: `analyze_novel:${projectId}:${episodeId || 'global'}`,
    priority: 1,
  })
}

export async function handleNovelPromotionAnalyzeGlobalRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireProjectAuth(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { session, project } = authResult
  ensureNovelPromotionMode(project.mode)

  const body = toRecord(await request.json().catch(() => ({})))
  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    type: TASK_TYPE.ANALYZE_GLOBAL,
    targetType: 'NovelPromotionProject',
    targetId: projectId,
    routePath: `/api/novel-promotion/${projectId}/analyze-global`,
    body,
    dedupeKey: `analyze_global:${projectId}`,
  })
}

export async function handleNovelPromotionAnalyzeShotVariantsRequest(
  request: Request,
  projectId: string,
) {
  const body = toRecord(await request.json().catch(() => ({})))
  const panelId = readTrimmedString(body.panelId)
  if (!panelId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const episodeId = readTrimmedString(body.episodeId)
  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    episodeId: episodeId || null,
    type: TASK_TYPE.ANALYZE_SHOT_VARIANTS,
    targetType: 'NovelPromotionPanel',
    targetId: panelId,
    routePath: `/api/novel-promotion/${projectId}/analyze-shot-variants`,
    body,
    dedupeKey: `analyze_shot_variants:${panelId}`,
  })
}

export async function handleNovelPromotionCharacterProfileConfirmRequest(
  request: Request,
  projectId: string,
) {
  const body = toRecord(await request.json().catch(() => ({})))
  const characterId = readTrimmedString(body.characterId)
  if (!characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const authResult = await requireProjectAuth(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    type: TASK_TYPE.CHARACTER_PROFILE_CONFIRM,
    targetType: 'NovelPromotionCharacter',
    targetId: characterId,
    routePath: `/api/novel-promotion/${projectId}/character-profile/confirm`,
    body,
    dedupeKey: `character_profile_confirm:${characterId}`,
  })
}

export async function handleNovelPromotionCharacterProfileBatchConfirmRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireProjectAuth(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = toRecord(await request.json().catch(() => ({})))
  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    type: TASK_TYPE.CHARACTER_PROFILE_BATCH_CONFIRM,
    targetType: 'NovelPromotionProject',
    targetId: projectId,
    routePath: `/api/novel-promotion/${projectId}/character-profile/batch-confirm`,
    body,
    dedupeKey: `character_profile_batch_confirm:${projectId}`,
  })
}

export async function handleNovelPromotionClipsBuildRequest(
  request: Request,
  projectId: string,
) {
  const body = toRecord(await request.json().catch(() => ({})))
  const episodeId = readTrimmedString(body.episodeId)
  if (!episodeId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const authResult = await requireProjectAuth(projectId, {
    include: { characters: true, locations: true },
  })
  if (isErrorResponse(authResult)) return authResult
  const { session, project } = authResult
  ensureNovelPromotionMode(project.mode)

  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    episodeId,
    type: TASK_TYPE.CLIPS_BUILD,
    targetType: 'NovelPromotionEpisode',
    targetId: episodeId,
    routePath: `/api/novel-promotion/${projectId}/clips`,
    body: {
      ...body,
      displayMode: 'detail',
    },
    dedupeKey: `clips_build:${episodeId}`,
    priority: 1,
  })
}

export async function handleNovelPromotionEpisodeSplitRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { session, project } = authResult
  ensureNovelPromotionMode(project.mode)

  const body = toRecord(await request.json().catch(() => ({})))
  const content = typeof body.content === 'string' ? body.content : ''
  if (!content || content.length < 100) {
    throw new ApiError('INVALID_PARAMS')
  }

  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    type: TASK_TYPE.EPISODE_SPLIT_LLM,
    targetType: 'NovelPromotionProject',
    targetId: projectId,
    routePath: `/api/novel-promotion/${projectId}/episodes/split`,
    body: { content },
    dedupeKey: `episode_split_llm:${projectId}:${content.length}`,
  })
}

export async function handleNovelPromotionScreenplayConversionRequest(
  request: Request,
  projectId: string,
) {
  const body = toRecord(await request.json().catch(() => ({})))
  const episodeId = readTrimmedString(body.episodeId)
  if (!episodeId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const authResult = await requireProjectAuth(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { session, project } = authResult
  ensureNovelPromotionMode(project.mode)

  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    episodeId,
    type: TASK_TYPE.SCREENPLAY_CONVERT,
    targetType: 'NovelPromotionEpisode',
    targetId: episodeId,
    routePath: `/api/novel-promotion/${projectId}/screenplay-conversion`,
    body: {
      ...body,
      displayMode: 'detail',
    },
    dedupeKey: `screenplay_convert:${episodeId}`,
    priority: 2,
  })
}

export async function handleNovelPromotionScriptToStoryboardStreamRequest(
  request: Request,
  projectId: string,
) {
  const body = toRecord(await request.json().catch(() => ({})))
  const episodeId = readTrimmedString(body.episodeId)
  if (!episodeId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const authResult = await requireProjectAuth(projectId, {
    include: { characters: true, locations: true },
  })
  if (isErrorResponse(authResult)) return authResult
  const { session, project } = authResult
  ensureNovelPromotionMode(project.mode)

  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    episodeId,
    type: TASK_TYPE.SCRIPT_TO_STORYBOARD_RUN,
    targetType: 'NovelPromotionEpisode',
    targetId: episodeId,
    routePath: `/api/novel-promotion/${projectId}/script-to-storyboard-stream`,
    body: {
      ...body,
      displayMode: 'detail',
    },
    dedupeKey: `script_to_storyboard_run:${episodeId}`,
    priority: 2,
  })
}

export async function handleNovelPromotionReferenceToCharacterRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const referenceImages = parseReferenceImages(body)
  if (referenceImages.length === 0) {
    throw new ApiError('INVALID_PARAMS')
  }

  const count = normalizeImageGenerationCount('reference-to-character', body.count)
  body.count = count

  const isBackgroundJob =
    body.isBackgroundJob === true || body.isBackgroundJob === 1 || body.isBackgroundJob === '1'
  const characterId = readTrimmedString(body.characterId)
  const appearanceId = readTrimmedString(body.appearanceId)
  if (isBackgroundJob && (!characterId || !appearanceId)) {
    throw new ApiError('INVALID_PARAMS')
  }

  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    type: TASK_TYPE.REFERENCE_TO_CHARACTER,
    targetType: appearanceId ? 'CharacterAppearance' : 'NovelPromotionProject',
    targetId: appearanceId || characterId || projectId,
    routePath: `/api/novel-promotion/${projectId}/reference-to-character`,
    body,
    dedupeKey: `reference_to_character:${appearanceId || characterId || projectId}:${count}`,
  })
}

export async function handleNovelPromotionStoryToScriptStreamRequest(
  request: Request,
  projectId: string,
) {
  const body = toRecord(await request.json().catch(() => ({})))
  const episodeId = readTrimmedString(body.episodeId)
  const content = readTrimmedString(body.content)
  if (!episodeId || !content) {
    throw new ApiError('INVALID_PARAMS')
  }

  const authResult = await requireProjectAuth(projectId, {
    include: { characters: true, locations: true },
  })
  if (isErrorResponse(authResult)) return authResult
  const { session, project } = authResult
  ensureNovelPromotionMode(project.mode)

  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    episodeId,
    type: TASK_TYPE.STORY_TO_SCRIPT_RUN,
    targetType: 'NovelPromotionEpisode',
    targetId: episodeId,
    routePath: `/api/novel-promotion/${projectId}/story-to-script-stream`,
    body: {
      ...body,
      displayMode: 'detail',
    },
    dedupeKey: `story_to_script_run:${episodeId}`,
    priority: 2,
  })
}

export async function handleNovelPromotionVoiceAnalyzeRequest(
  request: Request,
  projectId: string,
) {
  const body = toRecord(await request.json().catch(() => ({})))
  const episodeId = readTrimmedString(body.episodeId)
  if (!episodeId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult
  const { session, project } = authResult
  ensureNovelPromotionMode(project.mode)

  return ensureMaybeSubmitTaskOrThrow({
    request,
    userId: session.user.id,
    projectId,
    episodeId,
    type: TASK_TYPE.VOICE_ANALYZE,
    targetType: 'NovelPromotionEpisode',
    targetId: episodeId,
    routePath: `/api/novel-promotion/${projectId}/voice-analyze`,
    body: {
      ...body,
      displayMode: 'detail',
    },
    dedupeKey: `voice_analyze:${episodeId}`,
    priority: 1,
  })
}

