/**
 * 本地文件服务API
 * 
 * 仅在 STORAGE_TYPE=local 时使用
 * 提供本地文件的HTTP访问服务
 */

import { handleLocalFileRequest } from '@engine/services/local-file-route-service'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path: pathSegments } = await params
    const decodedPath = decodeURIComponent(pathSegments.join('/'))
    return handleLocalFileRequest(request, decodedPath)
}
