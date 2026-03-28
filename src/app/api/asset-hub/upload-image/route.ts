import { apiHandler } from '@/lib/api-errors'
import { handleUploadAssetHubImageRequest } from '@engine/services/asset-hub-media-route-service'

export const POST = apiHandler(handleUploadAssetHubImageRequest)

