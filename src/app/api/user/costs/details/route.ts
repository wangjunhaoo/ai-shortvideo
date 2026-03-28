import { apiHandler } from '@/lib/api-errors'
import { handleUserCostDetailsRequest } from '@engine/services/user-billing-route-service'

/**
 * GET /api/user/costs/details
 * 获取用户费用明细（分页）
 */
export const GET = apiHandler(handleUserCostDetailsRequest)

