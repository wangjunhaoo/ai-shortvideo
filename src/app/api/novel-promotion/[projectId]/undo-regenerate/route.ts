import { apiHandler } from '@/lib/api-errors'
import { handleNovelPromotionUndoRegenerateRequest } from '@engine/services/novel-promotion-media-route-service'

export const POST = apiHandler(async (
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionUndoRegenerateRequest(request, projectId)
})
