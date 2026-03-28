import { apiHandler } from '@/lib/api-errors'
import { handleNovelPromotionScreenplayConversionRequest } from '@engine/services/novel-promotion-llm-route-service'

export const POST = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionScreenplayConversionRequest(request, projectId)
})

