import { apiHandler } from '@/lib/api-errors'
import {
  handleNovelPromotionVoiceLineCreateRequest,
  handleNovelPromotionVoiceLineDeleteRequest,
  handleNovelPromotionVoiceLinesListRequest,
  handleNovelPromotionVoiceLineUpdateRequest,
} from '@engine/services/novel-promotion-route-service'

export const GET = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionVoiceLinesListRequest(request, projectId)
})

export const POST = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionVoiceLineCreateRequest(request, projectId)
})

export const PATCH = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionVoiceLineUpdateRequest(request, projectId)
})

export const DELETE = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionVoiceLineDeleteRequest(request, projectId)
})
