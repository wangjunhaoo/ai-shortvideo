import { handleRuntimeBootIdRequest } from '@engine/services/runtime-health-route-service'

/**
 * GET /api/system/boot-id
 * 返回服务器启动ID，用于检测服务器是否重启
 */
export async function GET() {
    return handleRuntimeBootIdRequest()
}
