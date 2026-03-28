import { apiHandler } from '@/lib/api-errors'
import {
  handleCreateAssetHubVoiceRequest,
  handleListAssetHubVoicesRequest,
} from '@engine/services/asset-hub-route-service'

export const GET = apiHandler(handleListAssetHubVoicesRequest)

export const POST = apiHandler(handleCreateAssetHubVoiceRequest)
