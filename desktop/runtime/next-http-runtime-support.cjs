const NEXT_HTTP_RUNTIME_SUPPORT_REMOVED =
  'next http runtime support 已退场，桌面主链不再允许 next start 支撑层。'

function throwRemovedError() {
  throw new Error(NEXT_HTTP_RUNTIME_SUPPORT_REMOVED)
}

async function rejectRemovedError() {
  throw new Error(NEXT_HTTP_RUNTIME_SUPPORT_REMOVED)
}

module.exports = {
  NEXT_HTTP_RUNTIME_SUPPORT_REMOVED,
  assertNextHttpRuntimeDependencies: throwRemovedError,
  smokeTestNextHttpRuntimeDependencies: rejectRemovedError,
  startNextHttpRuntime: throwRemovedError,
  waitForNextHttpRuntimeReady: rejectRemovedError,
  NEXT_HEALTH_PATH: '/api/system/boot-id',
}
