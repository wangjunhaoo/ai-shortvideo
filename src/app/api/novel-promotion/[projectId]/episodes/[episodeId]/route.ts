import { apiHandler } from '@/lib/api-errors'
import {
  handleNovelPromotionEpisodeDeleteRequest,
  handleNovelPromotionEpisodeDetailRequest,
  handleNovelPromotionEpisodeUpdateRequest,
} from '@engine/services/novel-promotion-route-service'

export const GET = apiHandler(async (
  _request,
  context: { params: Promise<{ projectId: string; episodeId: string }> },
) => {
  const { projectId, episodeId } = await context.params
  return handleNovelPromotionEpisodeDetailRequest(projectId, episodeId)
})

export const PATCH = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string; episodeId: string }> },
) => {
  const { projectId, episodeId } = await context.params
  return handleNovelPromotionEpisodeUpdateRequest(request, projectId, episodeId)
})

export const DELETE = apiHandler(async (
  _request,
  context: { params: Promise<{ projectId: string; episodeId: string }> },
) => {
  const { projectId, episodeId } = await context.params
  return handleNovelPromotionEpisodeDeleteRequest(projectId, episodeId)
})
