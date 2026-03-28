import { apiHandler } from '@/lib/api-errors'
import { handleUploadAssetHubTempRequest } from '@engine/services/asset-hub-media-route-service'

export const POST = apiHandler(handleUploadAssetHubTempRequest)

