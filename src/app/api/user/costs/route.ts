import { apiHandler } from '@/lib/api-errors'
import { handleUserCostsRequest } from '@engine/services/user-billing-route-service'

/**
 * GET /api/user/costs
 * 获取当前用户所有项目费用汇总
 */
export const GET = apiHandler(handleUserCostsRequest)

