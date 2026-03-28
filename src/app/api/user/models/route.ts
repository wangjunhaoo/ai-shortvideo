/**
 * 获取用户的模型列表
 *
 * 返回用户在个人中心启用的模型，供项目配置下拉框使用。
 * capabilities 仅来自系统内置目录（不信任用户提交的 model.capabilities）。
 */

import { apiHandler } from '@/lib/api-errors'
import { handleUserModelsRequest } from '@engine/services/user-settings-route-service'

export const GET = apiHandler(handleUserModelsRequest)



