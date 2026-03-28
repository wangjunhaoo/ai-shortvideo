import { apiHandler } from '@/lib/api-errors'
import { handleReferenceToAssetHubCharacterRequest } from '@engine/services/asset-hub-media-route-service'

export const POST = apiHandler(handleReferenceToAssetHubCharacterRequest)

