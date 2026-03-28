import { apiHandler } from '@/lib/api-errors'
import { handleAssetHubAiModifyCharacterRequest } from '@engine/services/asset-hub-route-service'

export const POST = apiHandler(handleAssetHubAiModifyCharacterRequest)
