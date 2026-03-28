'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { useRouter } from '@/i18n/navigation'
import {
  getRendererSession,
  signInWithCredentials,
  signOutRendererSession,
  type RendererAuthResult,
  type RendererAuthSession,
} from '@renderer/clients/auth-client'

const SIGNIN_REDIRECT_TARGET = { pathname: '/auth/signin' } as const
const WORKSPACE_REDIRECT_TARGET = { pathname: '/workspace' } as const
const RENDERER_AUTH_CHANGED_EVENT = 'renderer-auth:session-changed'

type RendererRouteTarget = Parameters<ReturnType<typeof useRouter>['push']>[0]
type RendererSessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface RendererSessionState {
  data: RendererAuthSession | null
  status: RendererSessionStatus
  update: () => Promise<RendererAuthSession | null>
}

type ProtectedSessionState = RendererSessionState & {
  canRenderProtected: boolean
  isLoading: boolean
}

type GuestSessionState = RendererSessionState & {
  canRenderGuest: boolean
  isLoading: boolean
}

const RendererSessionContext = createContext<RendererSessionState | null>(null)

function notifyRendererSessionChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(RENDERER_AUTH_CHANGED_EVENT))
}

export function RendererSessionProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<RendererAuthSession | null>(null)
  const [status, setStatus] = useState<RendererSessionStatus>('loading')

  const update = useCallback(async () => {
    try {
      const session = await getRendererSession()
      setData(session)
      setStatus(session ? 'authenticated' : 'unauthenticated')
      return session
    } catch {
      setData(null)
      setStatus('unauthenticated')
      return null
    }
  }, [])

  useEffect(() => {
    void update()

    if (typeof window === 'undefined') return undefined

    const handleSessionChanged = () => {
      void update()
    }

    window.addEventListener(RENDERER_AUTH_CHANGED_EVENT, handleSessionChanged)
    return () => {
      window.removeEventListener(RENDERER_AUTH_CHANGED_EVENT, handleSessionChanged)
    }
  }, [update])

  const value = useMemo<RendererSessionState>(() => ({
    data,
    status,
    update,
  }), [data, status, update])

  return (
    <RendererSessionContext.Provider value={value}>
      {children}
    </RendererSessionContext.Provider>
  )
}

export function useRendererSession() {
  const context = useContext(RendererSessionContext)
  if (!context) {
    throw new Error('RendererSessionProvider 未挂载')
  }
  return context
}

export function useRequiredRendererSession(
  redirectTo: RendererRouteTarget = SIGNIN_REDIRECT_TARGET,
): ProtectedSessionState {
  const router = useRouter()
  const sessionState = useRendererSession()
  const { status } = sessionState

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(redirectTo)
    }
  }, [redirectTo, router, status])

  return {
    ...sessionState,
    isLoading: status === 'loading',
    canRenderProtected: status === 'authenticated' && !!sessionState.data,
  }
}

export function useGuestRendererSession(
  redirectTo: RendererRouteTarget = WORKSPACE_REDIRECT_TARGET,
): GuestSessionState {
  const router = useRouter()
  const sessionState = useRendererSession()
  const { status } = sessionState

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(redirectTo)
    }
  }, [redirectTo, router, status])

  return {
    ...sessionState,
    isLoading: status !== 'unauthenticated',
    canRenderGuest: status === 'unauthenticated',
  }
}

type RendererCredentialProvider = 'credentials'

export async function rendererSignIn(
  provider: RendererCredentialProvider,
  options: {
    username: string
    password: string
    redirect?: boolean
    callbackUrl?: string
  },
): Promise<RendererAuthResult> {
  if (provider !== 'credentials') {
    throw new Error(`不支持的登录提供商: ${provider}`)
  }

  const result = await signInWithCredentials({
    username: options.username,
    password: options.password,
    callbackUrl: options.callbackUrl,
  })

  if (result.ok) {
    notifyRendererSessionChanged()
    if (options.redirect !== false && typeof window !== 'undefined') {
      window.location.assign(result.url || options.callbackUrl || '/')
    }
  }

  return result
}

export async function rendererSignOut(options?: {
  callbackUrl?: string
  redirect?: boolean
}): Promise<RendererAuthResult> {
  const result = await signOutRendererSession({
    callbackUrl: options?.callbackUrl,
  })

  notifyRendererSessionChanged()

  if (options?.redirect !== false && typeof window !== 'undefined') {
    window.location.assign(result.url || options?.callbackUrl || '/')
  }

  return result
}
