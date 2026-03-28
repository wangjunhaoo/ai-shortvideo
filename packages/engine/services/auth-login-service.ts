import bcrypt from 'bcryptjs'
import { logAuthAction } from '@/lib/logging/semantic'
import { prisma } from '@engine/prisma'

export interface AuthenticatedUser {
  id: string
  name: string
}

export async function authenticateUserCredentials(input: {
  username?: string | null
  password?: string | null
}): Promise<AuthenticatedUser | null> {
  const username = input.username?.trim() || 'unknown'
  const password = input.password || ''

  if (!input.username || !password) {
    logAuthAction('LOGIN', username, { error: 'Missing credentials' })
    return null
  }

  const user = await prisma.user.findUnique({
    where: {
      name: input.username,
    },
  })

  if (!user || !user.password) {
    logAuthAction('LOGIN', input.username, { error: 'User not found' })
    return null
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    logAuthAction('LOGIN', input.username, { error: 'Invalid password' })
    return null
  }

  logAuthAction('LOGIN', user.name, { userId: user.id, success: true })

  return {
    id: user.id,
    name: user.name,
  }
}
