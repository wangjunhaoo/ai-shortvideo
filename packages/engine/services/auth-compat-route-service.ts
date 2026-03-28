/**
 * 遗留兼容认证路由已退场。
 * 保留该文件仅用于防止旧 import 静默恢复。
 */
function throwRemovedAuthCompatError(): never {
  throw new Error('AUTH_COMPAT_ROUTE_REMOVED')
}

export async function handleAuthCompatGetRequest() {
  return throwRemovedAuthCompatError()
}

export async function handleAuthCompatPostRequest() {
  return throwRemovedAuthCompatError()
}
