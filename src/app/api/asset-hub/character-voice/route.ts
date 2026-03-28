import { apiHandler } from '@/lib/api-errors'
import {
    handleSaveAssetHubCharacterVoiceRequest,
    handleUpdateAssetHubCharacterVoiceRequest,
} from '@engine/services/asset-hub-media-route-service'

export const POST = apiHandler(handleSaveAssetHubCharacterVoiceRequest)

export const PATCH = apiHandler(handleUpdateAssetHubCharacterVoiceRequest)

