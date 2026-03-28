function readBooleanFlag(name: string) {
  const value = (process.env[name] || '').trim().toLowerCase()
  return value === '1' || value === 'true' || value === 'yes' || value === 'on'
}

function readNormalizedArgv() {
  return Array.isArray(process.argv)
    ? process.argv.map((arg) => String(arg).trim().toLowerCase()).filter(Boolean)
    : []
}

function isBuildCommandArg(arg: string) {
  const normalized = arg.replace(/\\/g, '/')
  const segments = normalized.split('/').filter(Boolean)
  const baseName = segments.length > 0 ? segments[segments.length - 1] : normalized
  return baseName === 'next' || baseName === 'next.js'
}

export function isWebBuildPhase() {
  const phase = (process.env.NEXT_PHASE || '').trim().toLowerCase()
  if (phase === 'phase-production-build') return true

  const lifecycle = (process.env.npm_lifecycle_event || '').trim().toLowerCase()
  if (lifecycle === 'build' || lifecycle === 'desktop:build:web') return true

  const argv = readNormalizedArgv()
  return argv.includes('build') && argv.some(isBuildCommandArg)
}

export function isDesktopLocalTasksEnabled() {
  return readBooleanFlag('DESKTOP_LOCAL_TASKS')
}

export function isDesktopStandaloneMode() {
  return isDesktopLocalTasksEnabled()
}

export function isBillingFeatureEnabled() {
  return !isDesktopStandaloneMode()
}

export function shouldUseInMemoryRuntimeBus() {
  return isDesktopLocalTasksEnabled() || readBooleanFlag('DESKTOP_LOCAL_EVENTS')
}
