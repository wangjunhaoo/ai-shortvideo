import { apiHandler } from '@/lib/api-errors'
import { handleNovelPromotionVideoProxyRequest } from '@engine/services/novel-promotion-media-route-service'

export const GET = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionVideoProxyRequest(request, projectId)
})
