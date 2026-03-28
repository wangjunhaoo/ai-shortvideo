import { apiHandler } from '@/lib/api-errors'
import {
  handleNovelPromotionEditorDeleteRequest,
  handleNovelPromotionEditorGetRequest,
  handleNovelPromotionEditorUpsertRequest,
} from '@engine/services/novel-promotion-route-service'

export const GET = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionEditorGetRequest(request, projectId)
})

export const PUT = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionEditorUpsertRequest(request, projectId)
})

export const DELETE = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionEditorDeleteRequest(request, projectId)
})
