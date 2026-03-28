import { apiHandler } from '@/lib/api-errors'
import {
    handleCreateAssetHubCharacterAppearanceRequest,
    handleDeleteAssetHubCharacterAppearanceRequest,
    handleUpdateAssetHubCharacterAppearanceRequest,
} from '@engine/services/asset-hub-route-service'

export const PATCH = apiHandler(async (
    request,
    context: { params: Promise<{ characterId: string; appearanceIndex: string }> }
) => {
    const { characterId, appearanceIndex } = await context.params
    return handleUpdateAssetHubCharacterAppearanceRequest(request, characterId, appearanceIndex)
})

export const POST = apiHandler(async (
    request,
    context: { params: Promise<{ characterId: string; appearanceIndex: string }> }
) => {
    const { characterId } = await context.params
    return handleCreateAssetHubCharacterAppearanceRequest(request, characterId)
})

export const DELETE = apiHandler(async (
    _request,
    context: { params: Promise<{ characterId: string; appearanceIndex: string }> }
) => {
    const { characterId, appearanceIndex } = await context.params
    return handleDeleteAssetHubCharacterAppearanceRequest(characterId, appearanceIndex)
})
