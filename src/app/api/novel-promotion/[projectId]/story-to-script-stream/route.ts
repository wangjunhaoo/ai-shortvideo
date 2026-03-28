import { apiHandler } from '@/lib/api-errors'
import { handleNovelPromotionStoryToScriptStreamRequest } from '@engine/services/novel-promotion-llm-route-service'

export const runtime = 'nodejs'

export const POST = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionStoryToScriptStreamRequest(request, projectId)
})

