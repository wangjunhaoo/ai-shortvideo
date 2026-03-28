import { apiHandler } from '@/lib/api-errors'
import { handleUndoAssetHubImageRequest } from '@engine/services/asset-hub-media-route-service'

export const POST = apiHandler(handleUndoAssetHubImageRequest)

