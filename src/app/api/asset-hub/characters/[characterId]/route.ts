import { apiHandler } from '@/lib/api-errors'
import {
  handleDeleteAssetHubCharacterRequest,
  handleGetAssetHubCharacterRequest,
  handleUpdateAssetHubCharacterRequest,
} from '@engine/services/asset-hub-route-service'

export const GET = apiHandler(async (
    _request,
    context: { params: Promise<{ characterId: string }> }
) => {
    const { characterId } = await context.params
    return handleGetAssetHubCharacterRequest(characterId)
})

export const PATCH = apiHandler(async (
    request,
    context: { params: Promise<{ characterId: string }> }
) => {
    const { characterId } = await context.params
    return handleUpdateAssetHubCharacterRequest(request, characterId)
})

export const DELETE = apiHandler(async (
    _request,
    context: { params: Promise<{ characterId: string }> }
) => {
    const { characterId } = await context.params
    return handleDeleteAssetHubCharacterRequest(characterId)
})
