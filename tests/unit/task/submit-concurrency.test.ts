import { afterEach, describe, expect, it, vi } from 'vitest'

import { isSqliteDatabaseUrl, resolveBatchTaskSubmitConcurrency } from '@/lib/task/submit-concurrency'

describe('task submit concurrency', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('在桌面 SQLite 场景下降到单并发', () => {
    vi.stubEnv('DESKTOP_LOCAL_TASKS', 'true')
    vi.stubEnv('DATABASE_URL', 'file:C:/runtime/waoowaoo.db')

    expect(isSqliteDatabaseUrl()).toBe(true)
    expect(resolveBatchTaskSubmitConcurrency()).toBe(1)
  })

  it('在非 SQLite 场景保留默认并发', () => {
    vi.stubEnv('DESKTOP_LOCAL_TASKS', 'false')
    vi.stubEnv('DATABASE_URL', 'mysql://root:pass@127.0.0.1:3306/app')

    expect(isSqliteDatabaseUrl()).toBe(false)
    expect(resolveBatchTaskSubmitConcurrency()).toBe(4)
    expect(resolveBatchTaskSubmitConcurrency({ defaultConcurrency: 6 })).toBe(6)
  })
})
