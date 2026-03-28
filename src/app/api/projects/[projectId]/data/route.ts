import { apiHandler } from '@/lib/api-errors'
import { handleProjectFullDataRequest } from '@engine/services/project-route-service'

/**
 * 统一的项目数据加载API
 * 返回项目基础信息、全局配置、全局资产和剧集列表
 */
export const GET = apiHandler(async (
  _request,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params
  return handleProjectFullDataRequest(projectId)
})

