import type { Locale } from '@/i18n/routing'
import { ApiError } from '@/lib/api-errors'
import { buildDefaultTaskBillingInfo } from '@/lib/billing'
import { BillingOperationError } from '@/lib/billing/errors'
import { hasPanelVideoOutput } from '@/lib/task/has-output'
import { resolveBatchTaskSubmitConcurrency } from '@/lib/task/submit-concurrency'
import { submitTask } from '@/lib/task/submitter'
import { TASK_TYPE } from '@/lib/task/types'
import { withTaskUiPayload } from '@/lib/task/ui-payload'
import { mapWithConcurrency } from '@/lib/async/map-with-concurrency'
import { parseModelKeyStrict, type CapabilityValue } from '@core/model-config-contract'
import { resolveBuiltinCapabilitiesByModelKey } from '@core/model-capabilities/lookup'
import { resolveBuiltinPricing } from '@core/model-pricing/lookup'
import { resolveProjectModelCapabilityGenerationOptions } from '@engine/config-service'
import { prisma } from '@engine/prisma'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function toVideoRuntimeSelections(value: unknown): Record<string, CapabilityValue> {
  if (!isRecord(value)) return {}
  const selections: Record<string, CapabilityValue> = {}
  for (const [field, raw] of Object.entries(value)) {
    if (field === 'aspectRatio') continue
    if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
      selections[field] = raw
    }
  }
  return selections
}

function resolveVideoGenerationMode(payload: unknown): 'normal' | 'firstlastframe' {
  if (!isRecord(payload)) return 'normal'
  return isRecord(payload.firstLastFrame) ? 'firstlastframe' : 'normal'
}

function resolveVideoModelKeyFromPayload(payload: Record<string, unknown>): string | null {
  const firstLast = isRecord(payload.firstLastFrame) ? payload.firstLastFrame : null
  if (firstLast && typeof firstLast.flModel === 'string' && parseModelKeyStrict(firstLast.flModel)) {
    return firstLast.flModel
  }
  if (typeof payload.videoModel === 'string' && parseModelKeyStrict(payload.videoModel)) {
    return payload.videoModel
  }
  return null
}

function requireVideoModelKeyFromPayload(payload: unknown): string {
  if (!isRecord(payload) || typeof payload.videoModel !== 'string' || !parseModelKeyStrict(payload.videoModel)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'VIDEO_MODEL_REQUIRED',
      field: 'videoModel',
    })
  }
  return payload.videoModel
}

function validateFirstLastFrameModel(input: unknown) {
  if (input === undefined || input === null) return
  if (!isRecord(input)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'FIRSTLASTFRAME_PAYLOAD_INVALID',
      field: 'firstLastFrame',
    })
  }

  const flModel = input.flModel
  if (typeof flModel !== 'string' || !parseModelKeyStrict(flModel)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'FIRSTLASTFRAME_MODEL_INVALID',
      field: 'firstLastFrame.flModel',
    })
  }

  const capabilities = resolveBuiltinCapabilitiesByModelKey('video', flModel)
  if (capabilities?.video?.firstlastframe !== true) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'FIRSTLASTFRAME_MODEL_UNSUPPORTED',
      field: 'firstLastFrame.flModel',
    })
  }
}

async function resolveValidatedVideoTaskPayload(input: {
  payload: unknown
  projectId: string
  userId: string
}): Promise<Record<string, unknown>> {
  const payload = input.payload
  if (!isRecord(payload)) return {}
  const modelKey = resolveVideoModelKeyFromPayload(payload)
  if (!modelKey) return payload

  const builtinCaps = resolveBuiltinCapabilitiesByModelKey('video', modelKey)
  if (!builtinCaps) return payload

  const runtimeSelections = toVideoRuntimeSelections(payload.generationOptions)
  runtimeSelections.generationMode = resolveVideoGenerationMode(payload)

  let resolvedOptions: Record<string, CapabilityValue>
  try {
    resolvedOptions = await resolveProjectModelCapabilityGenerationOptions({
      projectId: input.projectId,
      userId: input.userId,
      modelType: 'video',
      modelKey,
      runtimeSelections,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new ApiError('INVALID_PARAMS', {
      code: 'VIDEO_CAPABILITY_COMBINATION_UNSUPPORTED',
      field: 'generationOptions',
      details: {
        model: modelKey,
        selections: runtimeSelections,
        message,
      },
    })
  }

  const resolution = resolveBuiltinPricing({
    apiType: 'video',
    model: modelKey,
    selections: resolvedOptions,
  })
  if (resolution.status === 'missing_capability_match') {
    throw new ApiError('INVALID_PARAMS', {
      code: 'VIDEO_CAPABILITY_COMBINATION_UNSUPPORTED',
      field: 'generationOptions',
      details: {
        model: modelKey,
        selections: resolvedOptions,
      },
    })
  }

  return {
    ...payload,
    generationOptions: resolvedOptions,
  }
}

function buildVideoPanelBillingInfoOrThrow(payload: unknown) {
  try {
    return buildDefaultTaskBillingInfo(TASK_TYPE.VIDEO_PANEL, isRecord(payload) ? payload : null)
  } catch (error) {
    if (
      error instanceof BillingOperationError
      && (
        error.code === 'BILLING_UNKNOWN_VIDEO_CAPABILITY_COMBINATION'
        || error.code === 'BILLING_UNKNOWN_VIDEO_RESOLUTION'
      )
    ) {
      throw new ApiError('INVALID_PARAMS', {
        code: 'VIDEO_CAPABILITY_COMBINATION_UNSUPPORTED',
        field: 'generationOptions',
      })
    }
    if (error instanceof BillingOperationError && error.code === 'BILLING_UNKNOWN_MODEL') {
      return null
    }
    throw error
  }
}

export async function submitNovelPromotionGenerateVideoTask(input: {
  projectId: string
  userId: string
  requestId?: string | null
  locale: Locale
  body: unknown
}) {
  const rawBody = isRecord(input.body) ? input.body : {}
  requireVideoModelKeyFromPayload(rawBody)
  validateFirstLastFrameModel(rawBody.firstLastFrame)
  const body = await resolveValidatedVideoTaskPayload({
    payload: rawBody,
    projectId: input.projectId,
    userId: input.userId,
  })

  const isBatch = body.all === true
  if (isBatch) {
    const episodeId = body.episodeId
    if (!episodeId) {
      throw new ApiError('INVALID_PARAMS')
    }

    const panels = await prisma.novelPromotionPanel.findMany({
      where: {
        storyboard: { episodeId: String(episodeId) },
        imageUrl: { not: null },
        OR: [
          { videoUrl: null },
          { videoUrl: '' },
        ],
      },
      select: { id: true },
    })

    if (panels.length === 0) {
      return { tasks: [], total: 0 }
    }

    const tasks = await mapWithConcurrency(
      panels,
      resolveBatchTaskSubmitConcurrency(),
      async (panel) =>
        submitTask({
          userId: input.userId,
          locale: input.locale,
          requestId: input.requestId,
          projectId: input.projectId,
          episodeId: String(episodeId),
          type: TASK_TYPE.VIDEO_PANEL,
          targetType: 'NovelPromotionPanel',
          targetId: panel.id,
          payload: withTaskUiPayload(body, {
            hasOutputAtStart: await hasPanelVideoOutput(panel.id),
          }),
          dedupeKey: `video_panel:${panel.id}`,
          billingInfo: buildVideoPanelBillingInfoOrThrow(body),
        }),
    )

    return {
      tasks,
      total: panels.length,
    }
  }

  const storyboardId = body.storyboardId
  const panelIndex = body.panelIndex
  if (!storyboardId || panelIndex === undefined) {
    throw new ApiError('INVALID_PARAMS')
  }

  const panel = await prisma.novelPromotionPanel.findFirst({
    where: {
      storyboardId: String(storyboardId),
      panelIndex: Number(panelIndex),
    },
    select: { id: true },
  })

  if (!panel) {
    throw new ApiError('NOT_FOUND')
  }

  return submitTask({
    userId: input.userId,
    locale: input.locale,
    requestId: input.requestId,
    projectId: input.projectId,
    type: TASK_TYPE.VIDEO_PANEL,
    targetType: 'NovelPromotionPanel',
    targetId: panel.id,
    payload: withTaskUiPayload(body, {
      hasOutputAtStart: await hasPanelVideoOutput(panel.id),
    }),
    dedupeKey: `video_panel:${panel.id}`,
    billingInfo: buildVideoPanelBillingInfoOrThrow(body),
  })
}
