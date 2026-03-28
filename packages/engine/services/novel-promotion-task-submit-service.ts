import { createHash } from 'node:crypto'
import type { Locale } from '@/i18n/routing'
import { ApiError } from '@/lib/api-errors'
import { buildDefaultTaskBillingInfo } from '@/lib/billing'
import { resolveInsertPanelUserInput } from '@/lib/novel-promotion/insert-panel'
import { validatePreviewText, validateVoicePrompt } from '@/lib/providers/bailian/voice-design'
import { hasPanelImageOutput } from '@/lib/task/has-output'
import { submitTask } from '@/lib/task/submitter'
import { TASK_TYPE } from '@/lib/task/types'
import { withTaskUiPayload } from '@/lib/task/ui-payload'
import { buildImageBillingPayload, getProjectModelConfig } from '@engine/config-service'
import { resolveModelSelection } from '@/lib/api-config'

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

export async function submitNovelPromotionRegenerateStoryboardTextTask(input: {
  projectId: string
  userId: string
  requestId?: string | null
  locale: Locale
  body: unknown
}) {
  const body = toObject(input.body)
  const storyboardId = typeof body.storyboardId === 'string' ? body.storyboardId : ''

  if (!storyboardId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const projectModelConfig = await getProjectModelConfig(input.projectId, input.userId)
  const billingPayload = {
    ...body,
    ...(projectModelConfig.analysisModel ? { analysisModel: projectModelConfig.analysisModel } : {}),
  }

  return submitTask({
    userId: input.userId,
    locale: input.locale,
    requestId: input.requestId,
    projectId: input.projectId,
    type: TASK_TYPE.REGENERATE_STORYBOARD_TEXT,
    targetType: 'NovelPromotionStoryboard',
    targetId: storyboardId,
    payload: billingPayload,
    dedupeKey: `regenerate_storyboard_text:${storyboardId}`,
    billingInfo: buildDefaultTaskBillingInfo(TASK_TYPE.REGENERATE_STORYBOARD_TEXT, billingPayload),
  })
}

export async function submitNovelPromotionInsertPanelTask(input: {
  projectId: string
  userId: string
  requestId?: string | null
  locale: Locale
  body: unknown
}) {
  const body = toObject(input.body)
  const storyboardId = typeof body.storyboardId === 'string' ? body.storyboardId : ''
  const insertAfterPanelId = typeof body.insertAfterPanelId === 'string' ? body.insertAfterPanelId : ''
  const userInput = resolveInsertPanelUserInput(body, input.locale)

  if (!storyboardId || !insertAfterPanelId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const projectModelConfig = await getProjectModelConfig(input.projectId, input.userId)
  const billingPayload = {
    ...body,
    userInput,
    ...(projectModelConfig.analysisModel ? { analysisModel: projectModelConfig.analysisModel } : {}),
  }

  return submitTask({
    userId: input.userId,
    locale: input.locale,
    requestId: input.requestId,
    projectId: input.projectId,
    type: TASK_TYPE.INSERT_PANEL,
    targetType: 'NovelPromotionStoryboard',
    targetId: storyboardId,
    payload: billingPayload,
    dedupeKey: `insert_panel:${storyboardId}:${insertAfterPanelId}`,
    billingInfo: buildDefaultTaskBillingInfo(TASK_TYPE.INSERT_PANEL, billingPayload),
  })
}

export async function submitNovelPromotionVoiceDesignTask(input: {
  projectId: string
  userId: string
  requestId?: string | null
  locale: Locale
  body: unknown
}) {
  const body = toObject(input.body)
  const voicePrompt = typeof body.voicePrompt === 'string' ? body.voicePrompt.trim() : ''
  const previewText = typeof body.previewText === 'string' ? body.previewText.trim() : ''
  const preferredName = typeof body.preferredName === 'string' && body.preferredName.trim()
    ? body.preferredName.trim()
    : 'custom_voice'
  const language = body.language === 'en' ? 'en' : 'zh'

  if (!validateVoicePrompt(voicePrompt).valid || !validatePreviewText(previewText).valid) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = {
    voicePrompt,
    previewText,
    preferredName,
    language,
    displayMode: 'detail' as const,
  }

  const digest = createHash('sha1')
    .update(`${input.userId}:${input.projectId}:${voicePrompt}:${previewText}:${preferredName}:${language}`)
    .digest('hex')
    .slice(0, 16)

  return submitTask({
    userId: input.userId,
    locale: input.locale,
    requestId: input.requestId,
    projectId: input.projectId,
    type: TASK_TYPE.VOICE_DESIGN,
    targetType: 'NovelPromotionProject',
    targetId: input.projectId,
    payload,
    dedupeKey: `${TASK_TYPE.VOICE_DESIGN}:${digest}`,
    billingInfo: buildDefaultTaskBillingInfo(TASK_TYPE.VOICE_DESIGN, payload),
  })
}

export async function submitNovelPromotionRegeneratePanelImageTask(input: {
  projectId: string
  userId: string
  requestId?: string | null
  locale: Locale
  body: unknown
}) {
  const body = toObject(input.body)
  const panelId = typeof body.panelId === 'string' ? body.panelId : ''
  const count = Number(body.count ?? 1)
  const candidateCount = Math.max(1, Math.min(4, Number.isFinite(count) ? count : 1))

  if (!panelId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const projectModelConfig = await getProjectModelConfig(input.projectId, input.userId)
  if (!projectModelConfig.storyboardModel) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'STORYBOARD_MODEL_NOT_CONFIGURED',
    })
  }

  try {
    await resolveModelSelection(input.userId, projectModelConfig.storyboardModel, 'image')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Storyboard image model is invalid'
    throw new ApiError('INVALID_PARAMS', {
      code: 'STORYBOARD_MODEL_INVALID',
      message,
    })
  }

  const basePayload = {
    ...body,
    candidateCount,
  }
  const billingPayload = await buildImageBillingPayload({
    projectId: input.projectId,
    userId: input.userId,
    imageModel: projectModelConfig.storyboardModel,
    basePayload,
  })

  const hasOutputAtStart = await hasPanelImageOutput(panelId)

  return submitTask({
    userId: input.userId,
    locale: input.locale,
    requestId: input.requestId,
    projectId: input.projectId,
    type: TASK_TYPE.IMAGE_PANEL,
    targetType: 'NovelPromotionPanel',
    targetId: panelId,
    payload: withTaskUiPayload(billingPayload, {
      intent: 'regenerate',
      hasOutputAtStart,
    }),
    dedupeKey: `image_panel:${panelId}:${candidateCount}`,
    billingInfo: buildDefaultTaskBillingInfo(TASK_TYPE.IMAGE_PANEL, billingPayload),
  })
}
