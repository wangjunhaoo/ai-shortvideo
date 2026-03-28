import { apiHandler } from '@/lib/api-errors'
import { handleUploadAssetHubVoiceRequest } from '@engine/services/asset-hub-route-service'

export const POST = apiHandler(handleUploadAssetHubVoiceRequest)
