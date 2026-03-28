import { apiHandler } from '@/lib/api-errors'
import {
  handleCreateAssetHubCharacterRequest,
  handleListAssetHubCharactersRequest,
} from '@engine/services/asset-hub-route-service'

export const GET = apiHandler(handleListAssetHubCharactersRequest)

export const POST = apiHandler(handleCreateAssetHubCharacterRequest)
