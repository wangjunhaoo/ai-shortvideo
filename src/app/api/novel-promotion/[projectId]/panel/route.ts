import { apiHandler } from '@/lib/api-errors'
import {
  handleNovelPromotionPanelCreateRequest,
  handleNovelPromotionPanelDeleteRequest,
  handleNovelPromotionPanelPatchRequest,
  handleNovelPromotionPanelPutRequest,
} from '@engine/services/novel-promotion-route-service'

export const POST = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionPanelCreateRequest(request, projectId)
})

export const DELETE = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionPanelDeleteRequest(request, projectId)
})

export const PATCH = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionPanelPatchRequest(request, projectId)
})

export const PUT = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionPanelPutRequest(request, projectId)
})
