import { apiHandler } from '@/lib/api-errors'
import {
  handleNovelPromotionLocationCreateRequest,
  handleNovelPromotionLocationDeleteRequest,
  handleNovelPromotionLocationUpdateRequest,
} from '@engine/services/novel-promotion-route-service'

export const POST = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionLocationCreateRequest(request, projectId)
})

export const PATCH = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionLocationUpdateRequest(request, projectId)
})

export const DELETE = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionLocationDeleteRequest(request, projectId)
})
