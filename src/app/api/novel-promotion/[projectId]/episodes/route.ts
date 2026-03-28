import { apiHandler } from '@/lib/api-errors'
import {
  handleNovelPromotionEpisodeCreateRequest,
  handleNovelPromotionEpisodesListRequest,
} from '@engine/services/novel-promotion-route-service'

export const GET = apiHandler(async (
  _request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionEpisodesListRequest(projectId)
})

export const POST = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionEpisodeCreateRequest(request, projectId)
})
