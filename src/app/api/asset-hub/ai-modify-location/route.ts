import { apiHandler } from '@/lib/api-errors'
import { handleAssetHubAiModifyLocationRequest } from '@engine/services/asset-hub-route-service'

export const POST = apiHandler(handleAssetHubAiModifyLocationRequest)
