/**
 * 该文件保留为废弃占位，避免旧路径被误恢复时静默回流到 next-auth。
 * 当前认证主链已经切到 local-auth-provider-service。
 */
function throwDeprecatedBridgeError(): never {
  throw new Error('NEXT_AUTH_BRIDGE_REMOVED')
}

export const authOptions = null

export function getNextAuthRouteHandler() {
  return throwDeprecatedBridgeError()
}

export async function readNextAuthSession() {
  return throwDeprecatedBridgeError()
}

export async function handleNextAuthGetRequest() {
  return throwDeprecatedBridgeError()
}

export async function handleNextAuthPostRequest() {
  return throwDeprecatedBridgeError()
}
