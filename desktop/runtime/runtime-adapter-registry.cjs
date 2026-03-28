const ADAPTER_LOADERS = {
  engine: () => require('./engine-runtime-adapter.cjs'),
}
const LOADED_ADAPTERS = new Map()

function listRuntimeAdapterIds() {
  return Object.keys(ADAPTER_LOADERS)
}

function loadRuntimeAdapter(adapterId) {
  if (LOADED_ADAPTERS.has(adapterId)) {
    return LOADED_ADAPTERS.get(adapterId)
  }

  const loadAdapter = ADAPTER_LOADERS[adapterId]
  if (!loadAdapter) {
    throw new Error(
      `未知的桌面 runtime adapter: ${adapterId}。可用值: ${listRuntimeAdapterIds().join(', ')}`,
    )
  }

  const adapter = loadAdapter()
  LOADED_ADAPTERS.set(adapterId, adapter)
  return adapter
}

function resolveRuntimeAdapter() {
  const adapterId = process.env.DESKTOP_RUNTIME_ADAPTER || 'engine'
  return loadRuntimeAdapter(adapterId)
}

module.exports = {
  listRuntimeAdapterIds,
  loadRuntimeAdapter,
  resolveRuntimeAdapter,
}
