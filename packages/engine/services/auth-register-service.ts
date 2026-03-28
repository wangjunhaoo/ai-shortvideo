import bcrypt from 'bcryptjs'
import { ApiError } from '@/lib/api-errors'
import { logAuthAction } from '@/lib/logging/semantic'
import { prisma } from '@engine/prisma'

export async function registerUser(input: {
  name: string
  password: string
}) {
  const name = input.name || 'unknown'
  const password = input.password

  if (!name || !password) {
    logAuthAction('REGISTER', name, { error: 'Missing credentials' })
    throw new ApiError('INVALID_PARAMS')
  }

  if (password.length < 6) {
    logAuthAction('REGISTER', name, { error: 'Password too short' })
    throw new ApiError('INVALID_PARAMS')
  }

  const existingUser = await prisma.user.findUnique({
    where: { name },
  })

  if (existingUser) {
    logAuthAction('REGISTER', name, { error: 'Phone number already exists' })
    throw new ApiError('INVALID_PARAMS')
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        password: hashedPassword,
      },
    })

    await tx.userBalance.create({
      data: {
        userId: newUser.id,
        balance: 0,
        frozenAmount: 0,
        totalSpent: 0,
      },
    })

    return newUser
  })

  logAuthAction('REGISTER', name, { userId: user.id, success: true })

  return {
    message: '注册成功',
    user: {
      id: user.id,
      name: user.name,
    },
  }
}
