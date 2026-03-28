import { apiHandler } from '@/lib/api-errors'
import {
  handleDeleteAssetHubVoiceRequest,
  handleUpdateAssetHubVoiceRequest,
} from '@engine/services/asset-hub-route-service'

export const DELETE = apiHandler(async (
    _request,
    context: { params: Promise<{ id: string }> }
) => {
    const { id } = await context.params
    return handleDeleteAssetHubVoiceRequest(id)
})

export const PATCH = apiHandler(async (
    request,
    context: { params: Promise<{ id: string }> }
) => {
    const { id } = await context.params
    return handleUpdateAssetHubVoiceRequest(request, id)
})
