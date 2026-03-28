import type { Locale } from '@/i18n/routing'
import { ApiError } from '@/lib/api-errors'
import { buildDefaultTaskBillingInfo } from '@/lib/billing'
import { submitTask } from '@/lib/task/submitter'
import { TASK_TYPE } from '@/lib/task/types'
import { buildImageBillingPayload, getProjectModelConfig } from '@engine/config-service'
import { prisma } from '@engine/prisma'

function createPanelVariantId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `panel-variant-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

async function rollbackCreatedVariantPanel(params: {
  panelId: string
  storyboardId: string
  panelIndex: number
}) {
  await prisma.$transaction(async (tx) => {
    await tx.novelPromotionPanel.delete({
      where: { id: params.panelId },
    })

    const maxPanel = await tx.novelPromotionPanel.findFirst({
      where: { storyboardId: params.storyboardId },
      orderBy: { panelIndex: 'desc' },
      select: { panelIndex: true },
    })
    const maxPanelIndex = maxPanel?.panelIndex ?? -1
    const offset = maxPanelIndex + 1000

    await tx.novelPromotionPanel.updateMany({
      where: {
        storyboardId: params.storyboardId,
        panelIndex: { gt: params.panelIndex },
      },
      data: {
        panelIndex: { increment: offset },
        panelNumber: { increment: offset },
      },
    })

    await tx.novelPromotionPanel.updateMany({
      where: {
        storyboardId: params.storyboardId,
        panelIndex: { gt: params.panelIndex + offset },
      },
      data: {
        panelIndex: { decrement: offset + 1 },
        panelNumber: { decrement: offset + 1 },
      },
    })

    const panelCount = await tx.novelPromotionPanel.count({
      where: { storyboardId: params.storyboardId },
    })

    await tx.novelPromotionStoryboard.update({
      where: { id: params.storyboardId },
      data: { panelCount },
    })
  })
}

export async function submitNovelPromotionPanelVariantTask(input: {
  projectId: string
  userId: string
  requestId?: string | null
  locale: Locale
  body: unknown
}) {
  const body = (input.body && typeof input.body === 'object' && !Array.isArray(input.body))
    ? input.body as Record<string, unknown>
    : {}
  const storyboardId = body.storyboardId
  const insertAfterPanelId = body.insertAfterPanelId
  const sourcePanelId = body.sourcePanelId
  const variant = body.variant

  if (!storyboardId || !insertAfterPanelId || !sourcePanelId) {
    throw new ApiError('INVALID_PARAMS')
  }
  if (!variant || typeof variant !== 'object' || !(variant as Record<string, unknown>).video_prompt) {
    throw new ApiError('INVALID_PARAMS')
  }

  const storyboard = await prisma.novelPromotionStoryboard.findUnique({
    where: { id: String(storyboardId) },
    select: {
      id: true,
      episode: {
        select: {
          novelPromotionProject: {
            select: {
              projectId: true,
            },
          },
        },
      },
    },
  })
  if (!storyboard || storyboard.episode.novelPromotionProject.projectId !== input.projectId) {
    throw new ApiError('NOT_FOUND')
  }

  const sourcePanel = await prisma.novelPromotionPanel.findUnique({
    where: { id: String(sourcePanelId) },
  })
  if (!sourcePanel || sourcePanel.storyboardId !== storyboard.id) {
    throw new ApiError('INVALID_PARAMS')
  }

  const insertAfter = await prisma.novelPromotionPanel.findUnique({
    where: { id: String(insertAfterPanelId) },
  })
  if (!insertAfter || insertAfter.storyboardId !== storyboard.id) {
    throw new ApiError('INVALID_PARAMS')
  }

  const projectModelConfig = await getProjectModelConfig(input.projectId, input.userId)
  const createdPanelId = createPanelVariantId()

  let billingPayload: Record<string, unknown>
  try {
    billingPayload = await buildImageBillingPayload({
      projectId: input.projectId,
      userId: input.userId,
      imageModel: projectModelConfig.storyboardModel,
      basePayload: { ...body, newPanelId: createdPanelId },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image model capability not configured'
    throw new ApiError('INVALID_PARAMS', {
      code: 'IMAGE_MODEL_CAPABILITY_NOT_CONFIGURED',
      message,
    })
  }

  const variantRecord = variant as Record<string, unknown>
  const createdPanel = await prisma.$transaction(async (tx) => {
    const affectedPanels = await tx.novelPromotionPanel.findMany({
      where: { storyboardId: storyboard.id, panelIndex: { gt: insertAfter.panelIndex } },
      select: { id: true, panelIndex: true },
      orderBy: { panelIndex: 'asc' },
    })

    for (const panel of affectedPanels) {
      await tx.novelPromotionPanel.update({
        where: { id: panel.id },
        data: { panelIndex: -(panel.panelIndex + 1) },
      })
    }

    for (const panel of affectedPanels) {
      await tx.novelPromotionPanel.update({
        where: { id: panel.id },
        data: { panelIndex: panel.panelIndex + 1 },
      })
    }

    const created = await tx.novelPromotionPanel.create({
      data: {
        id: createdPanelId,
        storyboardId: storyboard.id,
        panelIndex: insertAfter.panelIndex + 1,
        panelNumber: insertAfter.panelIndex + 2,
        shotType: typeof variantRecord.shot_type === 'string' ? variantRecord.shot_type : sourcePanel.shotType,
        cameraMove: typeof variantRecord.camera_move === 'string' ? variantRecord.camera_move : sourcePanel.cameraMove,
        description: typeof variantRecord.description === 'string' ? variantRecord.description : sourcePanel.description,
        videoPrompt: typeof variantRecord.video_prompt === 'string' ? variantRecord.video_prompt : sourcePanel.videoPrompt,
        location: typeof variantRecord.location === 'string' ? variantRecord.location : sourcePanel.location,
        characters: Array.isArray(variantRecord.characters)
          ? JSON.stringify(variantRecord.characters)
          : sourcePanel.characters,
        srtSegment: sourcePanel.srtSegment,
        duration: sourcePanel.duration,
      },
    })

    const panelCount = await tx.novelPromotionPanel.count({
      where: { storyboardId: storyboard.id },
    })

    await tx.novelPromotionStoryboard.update({
      where: { id: storyboard.id },
      data: { panelCount },
    })

    return created
  })

  try {
    const result = await submitTask({
      userId: input.userId,
      locale: input.locale,
      requestId: input.requestId,
      projectId: input.projectId,
      type: TASK_TYPE.PANEL_VARIANT,
      targetType: 'NovelPromotionPanel',
      targetId: createdPanel.id,
      payload: billingPayload,
      dedupeKey: `panel_variant:${storyboard.id}:${insertAfterPanelId}:${sourcePanelId}`,
      billingInfo: buildDefaultTaskBillingInfo(TASK_TYPE.PANEL_VARIANT, billingPayload),
    })

    return { ...result, panelId: createdPanel.id }
  } catch (error) {
    await rollbackCreatedVariantPanel({
      panelId: createdPanel.id,
      storyboardId: storyboard.id,
      panelIndex: createdPanel.panelIndex,
    })
    throw error
  }
}
