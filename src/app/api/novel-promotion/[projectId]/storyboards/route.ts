import { apiHandler } from '@/lib/api-errors'
import {
  handleNovelPromotionStoryboardErrorClearRequest,
  handleNovelPromotionStoryboardsRequest,
} from '@engine/services/novel-promotion-route-service'

export const GET = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionStoryboardsRequest(request, projectId)
})

export const PATCH = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionStoryboardErrorClearRequest(request, projectId)
})
