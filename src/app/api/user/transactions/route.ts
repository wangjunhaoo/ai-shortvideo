import { apiHandler } from '@/lib/api-errors'
import { handleUserTransactionsRequest } from '@engine/services/user-billing-route-service'

/**
 * GET /api/user/transactions
 * 获取用户余额流水记录
 */
export const GET = apiHandler(handleUserTransactionsRequest)

