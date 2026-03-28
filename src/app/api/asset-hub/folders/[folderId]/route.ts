import { apiHandler } from '@/lib/api-errors'
import {
  handleDeleteAssetHubFolderRequest,
  handleUpdateAssetHubFolderRequest,
} from '@engine/services/asset-hub-route-service'

// 更新文件夹
export const PATCH = apiHandler(async (
    request,
    context: { params: Promise<{ folderId: string }> }
) => {
    const { folderId } = await context.params
    return handleUpdateAssetHubFolderRequest(request, folderId)
})

// 删除文件夹
export const DELETE = apiHandler(async (
    _request,
    context: { params: Promise<{ folderId: string }> }
) => {
    const { folderId } = await context.params
    return handleDeleteAssetHubFolderRequest(folderId)
})

