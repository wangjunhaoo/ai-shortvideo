import { apiHandler } from '@/lib/api-errors'
import { handleAssetHubGenerateImageRequest } from '@engine/services/asset-hub-route-service'

export const POST = apiHandler(handleAssetHubGenerateImageRequest)
