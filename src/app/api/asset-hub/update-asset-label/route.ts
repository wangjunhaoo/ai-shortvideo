import { apiHandler } from '@/lib/api-errors'
import { handleUpdateAssetHubLabelRequest } from '@engine/services/asset-hub-route-service'

export const POST = apiHandler(handleUpdateAssetHubLabelRequest)
