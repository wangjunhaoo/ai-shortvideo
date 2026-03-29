import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(),
}))

const bcryptMock = vi.hoisted(() => ({
  hash: vi.fn(),
}))

const logAuthActionMock = vi.hoisted(() => vi.fn())

vi.mock('@engine/prisma', () => ({
  prisma: prismaMock,
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: bcryptMock.hash,
  },
}))

vi.mock('@/lib/logging/semantic', () => ({
  logAuthAction: logAuthActionMock,
}))

import { registerUser } from '@engine/services/auth-register-service'

describe('auth-register-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.user.findUnique.mockResolvedValue(null)
    bcryptMock.hash.mockResolvedValue('hashed-password')
    prismaMock.$transaction.mockImplementation(async (callback: (tx: {
      user: { create: ReturnType<typeof vi.fn> }
      userBalance: { create: ReturnType<typeof vi.fn> }
    }) => Promise<unknown>) => {
      const tx = {
        user: {
          create: vi.fn().mockResolvedValue({
            id: 'user_1',
            name: 'new-user',
          }),
        },
        userBalance: {
          create: vi.fn().mockResolvedValue(undefined),
        },
      }
      return callback(tx)
    })
  })

  it('returns clear message when username already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing_user', name: 'admin' })

    await expect(
      registerUser({
        name: 'admin',
        password: '12345678',
      }),
    ).rejects.toThrow('用户名已存在，请直接登录')
  })

  it('returns clear message when username is missing', async () => {
    await expect(
      registerUser({
        name: '   ',
        password: '12345678',
      }),
    ).rejects.toThrow('请输入用户名')
  })

  it('trims username before creating user', async () => {
    const createdUsers: Array<{ name: string; password: string }> = []
    prismaMock.$transaction.mockImplementation(async (callback: (tx: {
      user: { create: ReturnType<typeof vi.fn> }
      userBalance: { create: ReturnType<typeof vi.fn> }
    }) => Promise<unknown>) => {
      const tx = {
        user: {
          create: vi.fn().mockImplementation(async ({ data }: { data: { name: string; password: string } }) => {
            createdUsers.push(data)
            return {
              id: 'user_1',
              name: data.name,
            }
          }),
        },
        userBalance: {
          create: vi.fn().mockResolvedValue(undefined),
        },
      }
      return callback(tx)
    })

    const payload = await registerUser({
      name: '  fresh-user  ',
      password: '12345678',
    })

    expect(payload.user.name).toBe('fresh-user')
    expect(createdUsers[0]).toEqual({
      name: 'fresh-user',
      password: 'hashed-password',
    })
  })
})
