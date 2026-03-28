import { apiHandler } from '@/lib/api-errors'
import {
  handleCreateProjectRequest,
  handleListProjectsRequest,
} from '@engine/services/project-route-service'

// GET - 获取用户的项目（支持分页和搜索）
export const GET = apiHandler(handleListProjectsRequest)

// POST - 创建新项目
export const POST = apiHandler(handleCreateProjectRequest)

