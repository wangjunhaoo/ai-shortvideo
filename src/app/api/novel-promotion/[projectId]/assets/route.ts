import { apiHandler } from '@/lib/api-errors'
import { handleNovelPromotionProjectAssetsRequest } from '@engine/services/novel-promotion-route-service'

export const GET = apiHandler(async (
  _request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionProjectAssetsRequest(projectId)
})
