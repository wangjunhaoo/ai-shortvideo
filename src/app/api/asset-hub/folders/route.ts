import { apiHandler } from '@/lib/api-errors'
import {
  handleCreateAssetHubFolderRequest,
  handleListAssetHubFoldersRequest,
} from '@engine/services/asset-hub-route-service'

// 获取用户所有文件夹
export const GET = apiHandler(handleListAssetHubFoldersRequest)

export const POST = apiHandler(handleCreateAssetHubFolderRequest)

