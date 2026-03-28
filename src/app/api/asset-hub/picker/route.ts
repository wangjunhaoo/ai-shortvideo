import { apiHandler } from '@/lib/api-errors'
import { handleListAssetHubPickerItemsRequest } from '@engine/services/asset-hub-route-service'

/**
 * GET /api/asset-hub/picker
 * 获取用户的全局资产列表，用于在项目中选择要复制的资产
 * 
 * Query params:
 * - type: 'character' | 'location'
 */
export const GET = apiHandler(handleListAssetHubPickerItemsRequest)

