import { apiHandler } from '@/lib/api-errors'
import { handleNovelPromotionInsertPanelRequest } from '@engine/services/novel-promotion-task-route-service'

export const POST = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionInsertPanelRequest(request, projectId)
})
