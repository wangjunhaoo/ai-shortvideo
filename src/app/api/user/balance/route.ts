import { apiHandler } from '@/lib/api-errors'
import { handleUserBalanceRequest } from '@engine/services/user-billing-route-service'

/**
 * GET /api/user/balance
 * 获取当前用户余额
 */
export const GET = apiHandler(handleUserBalanceRequest)

