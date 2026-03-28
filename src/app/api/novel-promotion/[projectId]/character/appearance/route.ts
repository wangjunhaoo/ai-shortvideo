import { apiHandler } from '@/lib/api-errors'
import {
  handleNovelPromotionCharacterAppearanceCreateRequest,
  handleNovelPromotionCharacterAppearanceDeleteRequest,
  handleNovelPromotionCharacterAppearanceUpdateRequest,
} from '@engine/services/novel-promotion-route-service'

export const POST = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionCharacterAppearanceCreateRequest(request, projectId)
})

export const PATCH = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionCharacterAppearanceUpdateRequest(request, projectId)
})

export const DELETE = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionCharacterAppearanceDeleteRequest(request, projectId)
})
