import { apiHandler } from '@/lib/api-errors'
import {
  handleUpdateUserPreferenceRequest,
  handleUserPreferenceRequest,
} from '@engine/services/user-settings-route-service'

// GET - 获取用户偏好配置
export const GET = apiHandler(handleUserPreferenceRequest)

// PATCH - 更新用户偏好配置
export const PATCH = apiHandler(handleUpdateUserPreferenceRequest)

