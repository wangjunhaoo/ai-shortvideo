import { apiHandler } from '@/lib/api-errors'
import { handleProjectCostsRequest } from '@engine/services/project-route-service'

/**
 * GET /api/projects/[projectId]/costs
 * 获取项目费用详情
 */
export const GET = apiHandler(async (
  _request,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params
  return handleProjectCostsRequest(projectId)
})

