import { apiHandler } from '@/lib/api-errors'
import {
  handleDeleteAssetHubLocationRequest,
  handleGetAssetHubLocationRequest,
  handleUpdateAssetHubLocationRequest,
} from '@engine/services/asset-hub-route-service'

export const GET = apiHandler(async (
    _request,
    context: { params: Promise<{ locationId: string }> }
) => {
    const { locationId } = await context.params
    return handleGetAssetHubLocationRequest(locationId)
})

export const PATCH = apiHandler(async (
    request,
    context: { params: Promise<{ locationId: string }> }
) => {
    const { locationId } = await context.params
    return handleUpdateAssetHubLocationRequest(request, locationId)
})

export const DELETE = apiHandler(async (
    _request,
    context: { params: Promise<{ locationId: string }> }
) => {
    const { locationId } = await context.params
    return handleDeleteAssetHubLocationRequest(locationId)
})
