import type { Locale } from '@/i18n/routing'
import { createHash } from 'crypto'
import { ApiError } from '@/lib/api-errors'
import { buildDefaultTaskBillingInfo } from '@/lib/billing'
import { PRIMARY_APPEARANCE_INDEX, isArtStyleValue } from '@/lib/constants'
import { normalizeImageGenerationCount } from '@/lib/image-generation/count'
import { ensureGlobalLocationImageSlots } from '@/lib/image-generation/location-slots'
import { sanitizeImageInputsForTaskPayload } from '@/lib/media/outbound-image'
import { validatePreviewText, validateVoicePrompt } from '@/lib/providers/bailian/voice-design'
import {
  hasGlobalCharacterAppearanceOutput,
  hasGlobalCharacterOutput,
  hasGlobalLocationImageOutput,
  hasGlobalLocationOutput,
} from '@/lib/task/has-output'
import { submitTask } from '@/lib/task/submitter'
import { TASK_TYPE } from '@/lib/task/types'
import { withTaskUiPayload } from '@/lib/task/ui-payload'
import { getUserModelConfig, buildImageBillingPayloadFromUserConfig } from '@engine/config-service'
import { prisma } from '@engine/prisma'

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function resolveRequestedArtStyle(body: Record<string, unknown>): string | null {
  if (!Object.prototype.hasOwnProperty.call(body, 'artStyle')) return null
  const artStyle = normalizeString(body.artStyle)
  if (!isArtStyleValue(artStyle)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'INVALID_ART_STYLE',
      message: 'artStyle must be a supported value',
    })
  }
  return artStyle
}

async function resolveStoredArtStyle(input: {
  userId: string
  type: 'character' | 'location'
  id: string
  appearanceIndex: number
}): Promise<string> {
  if (input.type === 'character') {
    const appearance = await prisma.globalCharacterAppearance.findFirst({
      where: {
        characterId: input.id,
        appearanceIndex: input.appearanceIndex,
        character: { userId: input.userId },
      },
      select: { artStyle: true },
    })
    if (!appearance) {
      throw new ApiError('NOT_FOUND')
    }
    const artStyle = normalizeString(appearance.artStyle)
    if (!isArtStyleValue(artStyle)) {
      throw new ApiError('INVALID_PARAMS', {
        code: 'MISSING_ART_STYLE',
        message: 'Character appearance artStyle is not configured',
      })
    }
    return artStyle
  }

  const location = await prisma.globalLocation.findFirst({
    where: {
      id: input.id,
      userId: input.userId,
    },
    select: { artStyle: true },
  })
  if (!location) {
    throw new ApiError('NOT_FOUND')
  }
  const artStyle = normalizeString(location.artStyle)
  if (!isArtStyleValue(artStyle)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'MISSING_ART_STYLE',
      message: 'Location artStyle is not configured',
    })
  }
  return artStyle
}

export async function submitAssetHubGenerateImageTask(input: {
  userId: string
  locale: Locale
  requestId?: string | null
  body: unknown
}) {
  const body = toObject(input.body)
  const type = normalizeString(body.type)
  const id = normalizeString(body.id)
  if (!type || !id) {
    throw new ApiError('INVALID_PARAMS')
  }
  if (type !== 'character' && type !== 'location') {
    throw new ApiError('INVALID_PARAMS')
  }

  const appearanceIndex = toNumber(body.appearanceIndex)
  const resolvedAppearanceIndex = appearanceIndex ?? PRIMARY_APPEARANCE_INDEX
  const count = type === 'character'
    ? normalizeImageGenerationCount('character', body.count)
    : normalizeImageGenerationCount('location', body.count)
  const requestedArtStyle = resolveRequestedArtStyle(body)
  const artStyle = requestedArtStyle || await resolveStoredArtStyle({
    userId: input.userId,
    type,
    id,
    appearanceIndex: resolvedAppearanceIndex,
  })

  if (type === 'location' && toNumber(body.imageIndex) === null) {
    const location = await prisma.globalLocation.findFirst({
      where: { id, userId: input.userId },
      select: { name: true, summary: true },
    })
    if (!location) {
      throw new ApiError('NOT_FOUND')
    }
    await ensureGlobalLocationImageSlots({
      locationId: id,
      count,
      fallbackDescription: location.summary || location.name,
    })
  }

  const payloadBase: Record<string, unknown> = type === 'character'
    ? { ...body, id, type, appearanceIndex: resolvedAppearanceIndex, artStyle, count }
    : { ...body, id, type, artStyle, count }

  const targetType = type === 'character' ? 'GlobalCharacter' : 'GlobalLocation'
  const hasOutputAtStart = type === 'character'
    ? await hasGlobalCharacterOutput({
      characterId: id,
      appearanceIndex: resolvedAppearanceIndex,
    })
    : await hasGlobalLocationOutput({
      locationId: id,
    })

  const userModelConfig = await getUserModelConfig(input.userId)
  const imageModel = type === 'character'
    ? userModelConfig.characterModel
    : userModelConfig.locationModel

  let billingPayload: Record<string, unknown>
  try {
    billingPayload = buildImageBillingPayloadFromUserConfig({
      userModelConfig,
      imageModel,
      basePayload: payloadBase,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image model capability not configured'
    throw new ApiError('INVALID_PARAMS', {
      code: 'IMAGE_MODEL_CAPABILITY_NOT_CONFIGURED',
      message,
    })
  }

  return submitTask({
    userId: input.userId,
    locale: input.locale,
    requestId: input.requestId,
    projectId: 'global-asset-hub',
    type: TASK_TYPE.ASSET_HUB_IMAGE,
    targetType,
    targetId: id,
    payload: withTaskUiPayload(billingPayload, { hasOutputAtStart }),
    dedupeKey: `${TASK_TYPE.ASSET_HUB_IMAGE}:${targetType}:${id}:${type === 'character' ? resolvedAppearanceIndex : 'na'}:${toNumber(body.imageIndex) === null ? count : `single:${toNumber(body.imageIndex)}`}`,
    billingInfo: buildDefaultTaskBillingInfo(TASK_TYPE.ASSET_HUB_IMAGE, billingPayload),
  })
}

export async function submitAssetHubModifyImageTask(input: {
  userId: string
  locale: Locale
  requestId?: string | null
  body: unknown
}) {
  const body = toObject(input.body)
  const type = body.type
  const modifyPrompt = body.modifyPrompt
  const id = body.id
  const appearanceIndex = body.appearanceIndex
  const imageIndex = body.imageIndex

  if (!type || !modifyPrompt || !id) {
    throw new ApiError('INVALID_PARAMS')
  }
  if (type !== 'character' && type !== 'location') {
    throw new ApiError('INVALID_PARAMS')
  }

  const extraImageAudit = sanitizeImageInputsForTaskPayload(
    Array.isArray(body.extraImageUrls) ? body.extraImageUrls : [],
  )
  const rejectedRelativePathCount = extraImageAudit.issues.filter(
    (issue) => issue.reason === 'relative_path_rejected',
  ).length
  if (rejectedRelativePathCount > 0) {
    throw new ApiError('INVALID_PARAMS')
  }

  const targetType = type === 'character' ? 'GlobalCharacterAppearance' : 'GlobalLocationImage'
  const targetId = type === 'character'
    ? `${id}:${appearanceIndex ?? PRIMARY_APPEARANCE_INDEX}:${imageIndex ?? 0}`
    : `${id}:${imageIndex ?? 0}`
  const hasOutputAtStart = type === 'character'
    ? await hasGlobalCharacterAppearanceOutput({
      targetId,
      characterId: String(id),
      appearanceIndex: toNumber(appearanceIndex),
      imageIndex: toNumber(imageIndex),
    })
    : await hasGlobalLocationImageOutput({
      targetId,
      locationId: String(id),
      imageIndex: toNumber(imageIndex),
    })

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

  const userModelConfig = await getUserModelConfig(input.userId)
  const imageModel = userModelConfig.editModel

  let billingPayload: Record<string, unknown>
  try {
    billingPayload = buildImageBillingPayloadFromUserConfig({
      userModelConfig,
      imageModel,
      basePayload: payload,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image model capability not configured'
    throw new ApiError('INVALID_PARAMS', { code: 'IMAGE_MODEL_CAPABILITY_NOT_CONFIGURED', message })
  }

  return submitTask({
    userId: input.userId,
    locale: input.locale,
    requestId: input.requestId,
    projectId: 'global-asset-hub',
    type: TASK_TYPE.ASSET_HUB_MODIFY,
    targetType,
    targetId,
    payload: withTaskUiPayload(billingPayload, {
      intent: 'modify',
      hasOutputAtStart,
    }),
    dedupeKey: `${TASK_TYPE.ASSET_HUB_MODIFY}:${targetId}`,
    billingInfo: buildDefaultTaskBillingInfo(TASK_TYPE.ASSET_HUB_MODIFY, billingPayload),
  })
}

export async function submitAssetHubVoiceDesignTask(input: {
  userId: string
  locale: Locale
  requestId?: string | null
  body: unknown
}) {
  const body = toObject(input.body)
  const voicePrompt = typeof body.voicePrompt === 'string' ? body.voicePrompt.trim() : ''
  const previewText = typeof body.previewText === 'string' ? body.previewText.trim() : ''
  const preferredName = typeof body.preferredName === 'string' && body.preferredName.trim()
    ? body.preferredName.trim()
    : 'custom_voice'
  const language = body.language === 'en' ? 'en' : 'zh'

  const promptValidation = validateVoicePrompt(voicePrompt)
  if (!promptValidation.valid) {
    throw new ApiError('INVALID_PARAMS')
  }
  const textValidation = validatePreviewText(previewText)
  if (!textValidation.valid) {
    throw new ApiError('INVALID_PARAMS')
  }

  const digest = createHash('sha1')
    .update(`${input.userId}:${voicePrompt}:${previewText}:${preferredName}:${language}`)
    .digest('hex')
    .slice(0, 16)

  const payload = {
    voicePrompt,
    previewText,
    preferredName,
    language,
    displayMode: 'detail' as const,
  }

  return submitTask({
    userId: input.userId,
    locale: input.locale,
    requestId: input.requestId,
    projectId: 'global-asset-hub',
    type: TASK_TYPE.ASSET_HUB_VOICE_DESIGN,
    targetType: 'GlobalAssetHubVoiceDesign',
    targetId: input.userId,
    payload,
    dedupeKey: `${TASK_TYPE.ASSET_HUB_VOICE_DESIGN}:${digest}`,
    billingInfo: buildDefaultTaskBillingInfo(TASK_TYPE.ASSET_HUB_VOICE_DESIGN, payload),
  })
}
