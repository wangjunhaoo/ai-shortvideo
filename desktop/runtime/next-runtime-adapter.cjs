const NEXT_RUNTIME_ADAPTER_REMOVED =
  'next runtime adapter 已退场，桌面主链仅允许 engine runtime。'

function throwRemovedError() {
  throw new Error(NEXT_RUNTIME_ADAPTER_REMOVED)
}

async function rejectRemovedError() {
  throw new Error(NEXT_RUNTIME_ADAPTER_REMOVED)
}

module.exports = {
  NEXT_RUNTIME_ADAPTER_REMOVED,
  ensurePackagedRuntimeDependencies: throwRemovedError,
  smokeTestPackagedRuntimeDependencies: rejectRemovedError,
  ensureRuntimeReady: rejectRemovedError,
  startRuntime: throwRemovedError,
  waitForRuntimeReady: rejectRemovedError,
}
