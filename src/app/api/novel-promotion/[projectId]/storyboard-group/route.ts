import { apiHandler } from '@/lib/api-errors'
import {
  handleNovelPromotionStoryboardGroupCreateRequest,
  handleNovelPromotionStoryboardGroupDeleteRequest,
  handleNovelPromotionStoryboardGroupMoveRequest,
} from '@engine/services/novel-promotion-route-service'

export const POST = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionStoryboardGroupCreateRequest(request, projectId)
})

export const PUT = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionStoryboardGroupMoveRequest(request, projectId)
})

export const DELETE = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionStoryboardGroupDeleteRequest(request, projectId)
})
