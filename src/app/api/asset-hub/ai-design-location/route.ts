import { apiHandler } from '@/lib/api-errors'
import { handleAssetHubAiDesignLocationRequest } from '@engine/services/asset-hub-route-service'

export const POST = apiHandler(handleAssetHubAiDesignLocationRequest)


