import { apiHandler } from '@/lib/api-errors'
import {
  handleProjectDeleteRequest,
  handleProjectDetailRequest,
  handleProjectUpdateRequest,
} from '@engine/services/project-route-service'

// GET - 获取项目详情
export const GET = apiHandler(async (
  _request,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params
  return handleProjectDetailRequest(projectId)
})

// PATCH - 更新项目配置
export const PATCH = apiHandler(async (
  request,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params
  return handleProjectUpdateRequest(request, projectId)
})

// DELETE - 删除项目（同时清理COS文件）
export const DELETE = apiHandler(async (
  _request,
  context: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await context.params
  return handleProjectDeleteRequest(projectId)
})

