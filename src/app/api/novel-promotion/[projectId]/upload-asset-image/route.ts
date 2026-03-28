import { apiHandler } from '@/lib/api-errors'
import { handleNovelPromotionAssetImageUploadRequest } from '@engine/services/novel-promotion-route-service'

export const POST = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionAssetImageUploadRequest(request, projectId)
})
