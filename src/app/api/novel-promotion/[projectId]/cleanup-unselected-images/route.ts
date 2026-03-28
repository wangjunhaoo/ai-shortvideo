import { apiHandler } from '@/lib/api-errors'
import { handleNovelPromotionCleanupUnselectedImagesRequest } from '@engine/services/novel-promotion-media-route-service'

export const POST = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionCleanupUnselectedImagesRequest(request, projectId)
})
