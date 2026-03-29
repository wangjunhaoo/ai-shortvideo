const SQLITE_URL_PREFIXES = ['file:', 'sqlite:'] as const

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) return fallback
  return Math.max(1, Math.floor(value as number))
}

export function isSqliteDatabaseUrl(databaseUrl = process.env.DATABASE_URL): boolean {
  const normalized = typeof databaseUrl === 'string'
    ? databaseUrl.trim().toLowerCase()
    : ''
  return SQLITE_URL_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

export function resolveBatchTaskSubmitConcurrency(options: {
  defaultConcurrency?: number
  sqliteConcurrency?: number
} = {}): number {
  const defaultConcurrency = normalizePositiveInteger(options.defaultConcurrency, 4)
  const sqliteConcurrency = normalizePositiveInteger(options.sqliteConcurrency, 1)

  if (process.env.DESKTOP_LOCAL_TASKS === 'true' || isSqliteDatabaseUrl()) {
    return sqliteConcurrency
  }

  return defaultConcurrency
}
