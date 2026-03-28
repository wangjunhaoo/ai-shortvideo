import { apiHandler } from '@/lib/api-errors'
import {
  handleCreateAssetHubLocationRequest,
  handleListAssetHubLocationsRequest,
} from '@engine/services/asset-hub-route-service'

export const GET = apiHandler(handleListAssetHubLocationsRequest)

export const POST = apiHandler(handleCreateAssetHubLocationRequest)
