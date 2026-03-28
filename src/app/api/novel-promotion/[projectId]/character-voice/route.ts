import { apiHandler } from '@/lib/api-errors'
import {
  handleNovelPromotionCharacterVoicePatchRequest,
  handleNovelPromotionCharacterVoicePostRequest,
} from '@engine/services/novel-promotion-route-service'

export const PATCH = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionCharacterVoicePatchRequest(request, projectId)
})

export const POST = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionCharacterVoicePostRequest(request, projectId)
})
