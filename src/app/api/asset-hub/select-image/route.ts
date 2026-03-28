import { apiHandler } from '@/lib/api-errors'
import { handleSelectAssetHubImageRequest } from '@engine/services/asset-hub-route-service'

export const POST = apiHandler(handleSelectAssetHubImageRequest)
