import { apiHandler } from '@/lib/api-errors'
import {
  handleNovelPromotionCharacterCreateRequest,
  handleNovelPromotionCharacterDeleteRequest,
  handleNovelPromotionCharacterUpdateRequest,
} from '@engine/services/novel-promotion-route-service'

export const POST = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionCharacterCreateRequest(request, projectId)
})

export const PATCH = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionCharacterUpdateRequest(request, projectId)
})

export const DELETE = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionCharacterDeleteRequest(request, projectId)
})
