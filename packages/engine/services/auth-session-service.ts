import { headers as readHeaders } from 'next/headers'
import { readAuthProviderSession } from '@engine/services/auth-provider-service'

export interface AuthSession {
  user: {
    id: string
    name?: string | null
    email?: string | null
  }
}

async function getInternalTaskSession(): Promise<AuthSession | null> {
  const expectedToken = process.env.INTERNAL_TASK_TOKEN || ''

  const incomingHeaders = await readHeaders()
  const token = incomingHeaders.get('x-internal-task-token') || ''
  const userId = incomingHeaders.get('x-internal-user-id') || ''
  if (!userId) return null
  if (expectedToken) {
    if (token !== expectedToken) return null
  } else if (process.env.NODE_ENV === 'production') {
    return null
  }

  return {
    user: {
      id: userId,
      name: 'internal-worker',
      email: null,
    },
  }
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const internalSession = await getInternalTaskSession()
  if (internalSession) return internalSession
  const session = await readAuthProviderSession()
  return session as AuthSession | null
}
