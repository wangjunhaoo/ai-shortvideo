import { apiHandler } from '@/lib/api-errors'
import { handleNovelPromotionPhotographyPlanUpdateRequest } from '@engine/services/novel-promotion-route-service'

export const PUT = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionPhotographyPlanUpdateRequest(request, projectId)
})
