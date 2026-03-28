import { apiHandler } from '@/lib/api-errors'
import { handleAssetHubAiDesignCharacterRequest } from '@engine/services/asset-hub-route-service'

export const POST = apiHandler(handleAssetHubAiDesignCharacterRequest)


