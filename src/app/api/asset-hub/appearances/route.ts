import { apiHandler } from '@/lib/api-errors'
import {
    handleCreateAssetHubAppearanceRequest,
    handleDeleteAssetHubAppearanceRequest,
    handleUpdateAssetHubAppearanceRequest,
} from '@engine/services/asset-hub-route-service'

export const POST = apiHandler(handleCreateAssetHubAppearanceRequest)

export const PATCH = apiHandler(handleUpdateAssetHubAppearanceRequest)

export const DELETE = apiHandler(handleDeleteAssetHubAppearanceRequest)

