import { apiHandler } from '@/lib/api-errors'
import { handleNovelPromotionCharacterImageSelectRequest } from '@engine/services/novel-promotion-route-service'

export const POST = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionCharacterImageSelectRequest(request, projectId)
})
