import { apiHandler } from '@/lib/api-errors'
import { handleAssetHubModifyImageRequest } from '@engine/services/asset-hub-route-service'

export const POST = apiHandler(handleAssetHubModifyImageRequest)
