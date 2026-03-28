import { apiHandler } from '@/lib/api-errors'
import { handleProjectAssetsRequest } from '@engine/services/project-route-service'

/**
 * ⚡ 延迟加载 API - 获取项目的 characters 和 locations 资产
 * 用于资产管理页面，避免首次加载时的性能开销
 */
export const GET = apiHandler(async (
    _request,
    context: { params: Promise<{ projectId: string }> }
) => {
    const { projectId } = await context.params
    return handleProjectAssetsRequest(projectId)
})

