import { apiHandler } from '@/lib/api-errors'
import {
  handleNovelPromotionSpeakerVoicesRequest,
  handleNovelPromotionSpeakerVoiceUpdateRequest,
} from '@engine/services/novel-promotion-route-service'

export const GET = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionSpeakerVoicesRequest(request, projectId)
})

export const PATCH = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionSpeakerVoiceUpdateRequest(request, projectId)
})
