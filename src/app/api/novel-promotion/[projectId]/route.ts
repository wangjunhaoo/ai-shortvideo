import { apiHandler } from '@/lib/api-errors'
import {
  handleNovelPromotionProjectCapabilityOverridesRequest,
  handleNovelPromotionProjectConfigUpdateRequest,
} from '@engine/services/novel-promotion-route-service'

export const GET = apiHandler(async (
  _request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionProjectCapabilityOverridesRequest(projectId)
})

export const PATCH = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> },
) => {
  const { projectId } = await context.params
  return handleNovelPromotionProjectConfigUpdateRequest(request, projectId)
})
