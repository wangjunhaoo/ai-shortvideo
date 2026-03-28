import { apiHandler } from '@/lib/api-errors'
import { handleNovelPromotionVoicesDownloadRequest } from '@engine/services/novel-promotion-route-service'

export const GET = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionVoicesDownloadRequest(request, projectId)
})
