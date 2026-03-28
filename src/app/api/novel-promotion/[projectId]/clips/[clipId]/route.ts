import { apiHandler } from '@/lib/api-errors'
import { handleNovelPromotionClipUpdateRequest } from '@engine/services/novel-promotion-route-service'

export const PATCH = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string; clipId: string }> },
) => {
  const { projectId, clipId } = await context.params
  return handleNovelPromotionClipUpdateRequest(request, projectId, clipId)
})
