import type { Locale } from '@/i18n/routing'
import { ApiError } from '@/lib/api-errors'
import { buildDefaultTaskBillingInfo } from '@/lib/billing'
import { isArtStyleValue, type ArtStyleValue } from '@/lib/constants'
import { normalizeImageGenerationCount } from '@/lib/image-generation/count'
import { ensureProjectLocationImageSlots } from '@/lib/image-generation/location-slots'
import { hasCharacterAppearanceOutput, hasLocationImageOutput, hasPanelImageOutput } from '@/lib/task/has-output'
import { submitTask } from '@/lib/task/submitter'
import { TASK_TYPE } from '@/lib/task/types'
import { withTaskUiPayload } from '@/lib/task/ui-payload'
import { buildImageBillingPayload, getProjectModelConfig } from '@engine/config-service'
import { prisma } from '@engine/prisma'

type ImageAuditIssue = Record<string, unknown> & {
  reason?: string
}

type SanitizeImageInputsForTaskPayload = (inputs: unknown[]) => {
  normalized: string[]
  issues: ImageAuditIssue[]
}

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function resolveArtStyle(body: Record<string, unknown>): ArtStyleValue | undefined {
  if (!Object.prototype.hasOwnProperty.call(body, 'artStyle')) return undefined
  const artStyle = normalizeString(body.artStyle)
  if (!isArtStyleValue(artStyle)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'INVALID_ART_STYLE',
      message: 'artStyle must be a supported value',
    })
  }
  return artStyle
}

function countRejectedRelativePathIssues(issues: ImageAuditIssue[]) {
  return issues.filter((issue) => issue.reason === 'relative_path_rejected').length
}

function normalizeSelectedAssets(
  selectedAssetsRaw: unknown[],
  sanitizeImageInputsForTaskPayload: SanitizeImageInputsForTaskPayload,
) {
  const selectedAssetIssues: Array<Record<string, unknown>> = []
  const normalizedSelectedAssets = selectedAssetsRaw.map((asset: unknown, assetIndex: number) => {
    if (!asset || typeof asset !== 'object') return asset
    const imageUrl = (asset as Record<string, unknown>).imageUrl
    const audit = sanitizeImageInputsForTaskPayload([imageUrl])
    for (const issue of audit.issues) {
      selectedAssetIssues.push({
        assetIndex,
        ...issue,
      })
    }
    const normalizedUrl = audit.normalized[0]
    if (!normalizedUrl) return asset
    return {
      ...toObject(asset),
      imageUrl: normalizedUrl,
    }
  })

  return {
    normalizedSelectedAssets,
    selectedAssetIssues,
  }
}

export async function submitNovelPromotionGenerateImageTask(input: {
  projectId: string
  userId: string
  requestId?: string | null
  locale: Locale
  body: unknown
}) {
  const body = toObject(input.body)
  const type = normalizeString(body.type)
  const id = normalizeString(body.id)
  const appearanceId = normalizeString(body.appearanceId)
  const artStyle = resolveArtStyle(body)
  const count = type === 'character'
    ? normalizeImageGenerationCount('character', body.count)
    : normalizeImageGenerationCount('location', body.count)

  if (!type || !id) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (type !== 'character' && type !== 'location') {
    throw new ApiError('INVALID_PARAMS')
  }

  const taskType = type === 'character' ? TASK_TYPE.IMAGE_CHARACTER : TASK_TYPE.IMAGE_LOCATION
  const targetType = type === 'character' ? 'CharacterAppearance' : 'LocationImage'
  const targetId = type === 'character' ? (appearanceId || id) : id

  if (!targetId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const imageIndex = toNumber(body.imageIndex)
  if (type === 'location' && imageIndex === null) {
    const location = await prisma.novelPromotionLocation.findUnique({
      where: { id },
      select: { name: true, summary: true },
    })
    if (!location) {
      throw new ApiError('NOT_FOUND')
    }
    await ensureProjectLocationImageSlots({
      locationId: id,
      count,
      fallbackDescription: location.summary || location.name,
    })
  }

  const hasOutputAtStart = type === 'character'
    ? await hasCharacterAppearanceOutput({
      appearanceId: targetId,
      characterId: id,
      appearanceIndex: toNumber(body.appearanceIndex),
    })
    : await hasLocationImageOutput({
      locationId: id,
      imageIndex,
    })

  const projectModelConfig = await getProjectModelConfig(input.projectId, input.userId)
  const imageModel = type === 'character'
    ? projectModelConfig.characterModel
    : projectModelConfig.locationModel
  const payloadBase = artStyle ? { ...body, artStyle, count } : { ...body, count }

  let billingPayload: Record<string, unknown>
  try {
    billingPayload = await buildImageBillingPayload({
      projectId: input.projectId,
      userId: input.userId,
      imageModel,
      basePayload: payloadBase,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image model capability not configured'
    throw new ApiError('INVALID_PARAMS', { code: 'IMAGE_MODEL_CAPABILITY_NOT_CONFIGURED', message })
  }

  return submitTask({
    userId: input.userId,
    locale: input.locale,
    requestId: input.requestId,
    projectId: input.projectId,
    type: taskType,
    targetType,
    targetId,
    payload: withTaskUiPayload(billingPayload, { hasOutputAtStart }),
    dedupeKey: `${taskType}:${targetId}:${imageIndex === null ? count : `single:${imageIndex}`}`,
    billingInfo: buildDefaultTaskBillingInfo(taskType, billingPayload),
  })
}

export async function submitNovelPromotionGenerateCharacterImageTask(input: {
  projectId: string
  userId: string
  requestId?: string | null
  locale: Locale
  body: unknown
}) {
  const body = toObject(input.body)
  const characterId = normalizeString(body.characterId)

  if (!characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  let targetAppearanceId = normalizeString(body.appearanceId)
  if (!targetAppearanceId) {
    const character = await prisma.novelPromotionCharacter.findUnique({
      where: { id: characterId },
      include: {
        appearances: {
          orderBy: { appearanceIndex: 'asc' },
        },
      },
    })
    if (!character) {
      throw new ApiError('NOT_FOUND')
    }
    const firstAppearance = character.appearances?.[0]
    if (!firstAppearance) {
      throw new ApiError('NOT_FOUND')
    }
    targetAppearanceId = firstAppearance.id
  }

  return submitNovelPromotionGenerateImageTask({
    projectId: input.projectId,
    userId: input.userId,
    requestId: input.requestId,
    locale: input.locale,
    body: {
      ...body,
      type: 'character',
      id: characterId,
      appearanceId: targetAppearanceId,
      count: normalizeImageGenerationCount('character', body.count),
    },
  })
}

export async function submitNovelPromotionRegenerateGroupTask(input: {
  projectId: string
  userId: string
  requestId?: string | null
  locale: Locale
  body: unknown
}) {
  const body = toObject(input.body)
  const type = body.type
  const id = typeof body.id === 'string' ? body.id : ''
  const appearanceId = typeof body.appearanceId === 'string' ? body.appearanceId : ''
  const count = type === 'character'
    ? normalizeImageGenerationCount('character', body.count)
    : normalizeImageGenerationCount('location', body.count)

  if (!type || !id) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (type !== 'character' && type !== 'location') {
    throw new ApiError('INVALID_PARAMS')
  }

  if (type === 'character' && !appearanceId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const targetType = type === 'character' ? 'CharacterAppearance' : 'LocationImage'
  const targetId = type === 'character' ? appearanceId : id

  if (type === 'location') {
    const location = await prisma.novelPromotionLocation.findUnique({
      where: { id },
      select: { name: true, summary: true },
    })
    if (!location) {
      throw new ApiError('NOT_FOUND')
    }
    await ensureProjectLocationImageSlots({
      locationId: id,
      count,
      fallbackDescription: location.summary || location.name,
    })
  }

  const hasOutputAtStart = type === 'character'
    ? await hasCharacterAppearanceOutput({
      appearanceId,
      characterId: id,
    })
    : await hasLocationImageOutput({
      locationId: id,
    })

  const projectModelConfig = await getProjectModelConfig(input.projectId, input.userId)
  const imageModel = type === 'character'
    ? projectModelConfig.characterModel
    : projectModelConfig.locationModel

  let billingPayload: Record<string, unknown>
  try {
    billingPayload = await buildImageBillingPayload({
      projectId: input.projectId,
      userId: input.userId,
      imageModel,
      basePayload: { ...body, count },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image model capability not configured'
    throw new ApiError('INVALID_PARAMS', { code: 'IMAGE_MODEL_CAPABILITY_NOT_CONFIGURED', message })
  }

  return await submitTask({
    userId: input.userId,
    locale: input.locale,
    requestId: input.requestId,
    projectId: input.projectId,
    type: TASK_TYPE.REGENERATE_GROUP,
    targetType,
    targetId,
    payload: withTaskUiPayload(billingPayload, {
      intent: 'regenerate',
      hasOutputAtStart,
    }),
    dedupeKey: `regenerate_group:${targetType}:${targetId}:${count}`,
    billingInfo: buildDefaultTaskBillingInfo(TASK_TYPE.REGENERATE_GROUP, billingPayload),
  })
}

export async function submitNovelPromotionRegenerateSingleImageTask(input: {
  projectId: string
  userId: string
  requestId?: string | null
  locale: Locale
  body: unknown
}) {
  const body = toObject(input.body)
  const type = body.type
  const id = typeof body.id === 'string' ? body.id : ''
  const appearanceId = typeof body.appearanceId === 'string' ? body.appearanceId : ''
  const imageIndex = body.imageIndex

  if (!type || !id || imageIndex === undefined) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (type !== 'character' && type !== 'location') {
    throw new ApiError('INVALID_PARAMS')
  }

  const taskType = type === 'character' ? TASK_TYPE.IMAGE_CHARACTER : TASK_TYPE.IMAGE_LOCATION
  const targetType = type === 'character' ? 'CharacterAppearance' : 'LocationImage'
  const targetId = type === 'character'
    ? (appearanceId || id)
    : id
  const parsedImageIndex = toNumber(imageIndex)

  const hasOutputAtStart = type === 'character'
    ? await hasCharacterAppearanceOutput({
      appearanceId: targetId,
      characterId: id,
    })
    : await hasLocationImageOutput({
      locationId: id,
      imageIndex: parsedImageIndex,
    })

  const projectModelConfig = await getProjectModelConfig(input.projectId, input.userId)
  const imageModel = type === 'character'
    ? projectModelConfig.characterModel
    : projectModelConfig.locationModel

  let billingPayload: Record<string, unknown>
  try {
    billingPayload = await buildImageBillingPayload({
      projectId: input.projectId,
      userId: input.userId,
      imageModel,
      basePayload: body,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image model capability not configured'
    throw new ApiError('INVALID_PARAMS', { code: 'IMAGE_MODEL_CAPABILITY_NOT_CONFIGURED', message })
  }

  return await submitTask({
    userId: input.userId,
    locale: input.locale,
    requestId: input.requestId,
    projectId: input.projectId,
    type: taskType,
    targetType,
    targetId,
    payload: withTaskUiPayload(billingPayload, {
      intent: 'regenerate',
      hasOutputAtStart,
    }),
    dedupeKey: `${taskType}:${targetId}:single:${imageIndex}`,
    billingInfo: buildDefaultTaskBillingInfo(taskType, billingPayload),
  })
}

export async function submitNovelPromotionModifyAssetImageTask(input: {
  projectId: string
  userId: string
  requestId?: string | null
  locale: Locale
  body: unknown
  sanitizeImageInputsForTaskPayload: SanitizeImageInputsForTaskPayload
}) {
  const body = toObject(input.body)
  const type = body.type
  const modifyPrompt = body.modifyPrompt

  if (!type || !modifyPrompt) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (type !== 'character' && type !== 'location') {
    throw new ApiError('INVALID_PARAMS')
  }

  const targetType = type === 'character' ? 'CharacterAppearance' : 'LocationImage'
  const targetId = type === 'character'
    ? (body.appearanceId || body.characterId)
    : (body.locationImageId || body.locationId)

  if (!targetId || typeof targetId !== 'string') {
    throw new ApiError('INVALID_PARAMS')
  }

  const hasOutputAtStart = type === 'character'
    ? await hasCharacterAppearanceOutput({
      appearanceId: typeof body.appearanceId === 'string' ? body.appearanceId : null,
      characterId: typeof body.characterId === 'string' ? body.characterId : null,
      appearanceIndex: toNumber(body.appearanceIndex),
    })
    : await hasLocationImageOutput({
      imageId: typeof body.locationImageId === 'string' ? body.locationImageId : null,
      locationId: typeof body.locationId === 'string' ? body.locationId : null,
      imageIndex: toNumber(body.imageIndex),
    })

  const extraImageAudit = input.sanitizeImageInputsForTaskPayload(
    Array.isArray(body.extraImageUrls) ? body.extraImageUrls : [],
  )
  if (countRejectedRelativePathIssues(extraImageAudit.issues) > 0) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = {
    ...body,
    extraImageUrls: extraImageAudit.normalized,
    meta: {
      ...toObject(body.meta),
      outboundImageInputAudit: {
        extraImageUrls: extraImageAudit.issues,
      },
    },
  }

  const projectModelConfig = await getProjectModelConfig(input.projectId, input.userId)
  const imageModel = projectModelConfig.editModel

  let billingPayload: Record<string, unknown>
  try {
    billingPayload = await buildImageBillingPayload({
      projectId: input.projectId,
      userId: input.userId,
      imageModel,
      basePayload: payload,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image model capability not configured'
    throw new ApiError('INVALID_PARAMS', { code: 'IMAGE_MODEL_CAPABILITY_NOT_CONFIGURED', message })
  }

  return await submitTask({
    userId: input.userId,
    locale: input.locale,
    requestId: input.requestId,
    projectId: input.projectId,
    type: TASK_TYPE.MODIFY_ASSET_IMAGE,
    targetType,
    targetId,
    payload: withTaskUiPayload(billingPayload, {
      intent: 'modify',
      hasOutputAtStart,
    }),
    dedupeKey: `modify_asset_image:${targetType}:${targetId}:${body.imageIndex ?? 'na'}`,
    billingInfo: buildDefaultTaskBillingInfo(TASK_TYPE.MODIFY_ASSET_IMAGE, billingPayload),
  })
}

export async function submitNovelPromotionModifyStoryboardImageTask(input: {
  projectId: string
  userId: string
  requestId?: string | null
  locale: Locale
  body: unknown
  sanitizeImageInputsForTaskPayload: SanitizeImageInputsForTaskPayload
}) {
  const body = toObject(input.body)
  const storyboardId = typeof body.storyboardId === 'string' ? body.storyboardId : ''
  const panelIndex = toNumber(body.panelIndex)
  const modifyPrompt = typeof body.modifyPrompt === 'string' ? body.modifyPrompt.trim() : ''

  if (!storyboardId || panelIndex === null || !modifyPrompt) {
    throw new ApiError('INVALID_PARAMS')
  }

  const panel = await prisma.novelPromotionPanel.findFirst({
    where: {
      storyboardId,
      panelIndex,
    },
    select: {
      id: true,
    },
  })
  if (!panel) {
    throw new ApiError('NOT_FOUND')
  }

  const extraImageAudit = input.sanitizeImageInputsForTaskPayload(
    Array.isArray(body.extraImageUrls) ? body.extraImageUrls : [],
  )
  const selectedAssetsRaw = Array.isArray(body.selectedAssets) ? body.selectedAssets : []
  const { normalizedSelectedAssets, selectedAssetIssues } = normalizeSelectedAssets(
    selectedAssetsRaw,
    input.sanitizeImageInputsForTaskPayload,
  )

  if (countRejectedRelativePathIssues([...extraImageAudit.issues, ...selectedAssetIssues]) > 0) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = {
    ...body,
    type: 'storyboard',
    panelId: panel.id,
    panelIndex,
    extraImageUrls: extraImageAudit.normalized,
    selectedAssets: normalizedSelectedAssets,
    meta: {
      ...toObject(body.meta),
      outboundImageInputAudit: {
        extraImageUrls: extraImageAudit.issues,
        selectedAssets: selectedAssetIssues,
      },
    },
  }
  const hasOutputAtStart = await hasPanelImageOutput(panel.id)

  const projectModelConfig = await getProjectModelConfig(input.projectId, input.userId)
  const imageModel = projectModelConfig.editModel

  let billingPayload: Record<string, unknown>
  try {
    billingPayload = await buildImageBillingPayload({
      projectId: input.projectId,
      userId: input.userId,
      imageModel,
      basePayload: payload,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image model capability not configured'
    throw new ApiError('INVALID_PARAMS', { code: 'IMAGE_MODEL_CAPABILITY_NOT_CONFIGURED', message })
  }

  return await submitTask({
    userId: input.userId,
    locale: input.locale,
    requestId: input.requestId,
    projectId: input.projectId,
    type: TASK_TYPE.MODIFY_ASSET_IMAGE,
    targetType: 'NovelPromotionPanel',
    targetId: panel.id,
    payload: withTaskUiPayload(billingPayload, {
      intent: 'modify',
      hasOutputAtStart,
    }),
    dedupeKey: `modify_storyboard_image:${panel.id}`,
    billingInfo: buildDefaultTaskBillingInfo(TASK_TYPE.MODIFY_ASSET_IMAGE, billingPayload),
  })
}
