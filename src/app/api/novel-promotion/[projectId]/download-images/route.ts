import { apiHandler } from '@/lib/api-errors'
import { handleNovelPromotionImagesDownloadRequest } from '@engine/services/novel-promotion-route-service'

export const GET = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionImagesDownloadRequest(request, projectId)
})
