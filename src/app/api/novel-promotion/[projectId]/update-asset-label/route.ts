import { apiHandler } from '@/lib/api-errors'
import { handleNovelPromotionAssetLabelUpdateRequest } from '@engine/services/novel-promotion-route-service'

export const POST = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionAssetLabelUpdateRequest(request, projectId)
})
