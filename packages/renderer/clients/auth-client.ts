import {
  JSON_HEADERS,
  rendererApiRequest as apiFetch,
} from '@renderer/clients/http-client'
import { authRoutes, withQuery } from '@shared/contracts/renderer-api-routes'

const FORM_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
}

export interface RendererAuthSession {
  user?: {
    id?: string
    name?: string | null
    email?: string | null
  }
  expires?: string
}

interface AuthCsrfResponse {
  csrfToken?: string
}

export interface RendererCredentialSignInOptions {
  username: string
  password: string
  callbackUrl?: string
}

export interface RendererAuthResult {
  ok: boolean
  status: number
  url: string | null
  error?: string
}

export function registerUser(payload: { name: string; password: string }) {
  return apiFetch(authRoutes.register, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}

export function getRendererSessionResponse() {
  return apiFetch(authRoutes.session, {
    method: 'GET',
    cache: 'no-store',
  })
}

async function getAuthCsrfToken(): Promise<string> {
  const response = await apiFetch(authRoutes.csrf, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('AUTH_CSRF_REQUEST_FAILED')
  }

  const payload = await response.json() as AuthCsrfResponse
  const csrfToken = typeof payload.csrfToken === 'string' ? payload.csrfToken.trim() : ''
  if (!csrfToken) {
    throw new Error('AUTH_CSRF_TOKEN_MISSING')
  }
  return csrfToken
}

export async function getRendererSession(): Promise<RendererAuthSession | null> {
  const response = await getRendererSessionResponse()
  if (!response.ok) {
    throw new Error(`AUTH_SESSION_REQUEST_FAILED:${response.status}`)
  }

  const payload = await response.json() as RendererAuthSession | null
  if (!payload?.user?.id) {
    return null
  }
  return payload
}

function readAuthErrorFromUrl(url: string | null): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    const error = parsed.searchParams.get('error')
    return error?.trim() || undefined
  } catch {
    return undefined
  }
}

async function readAuthResult(response: Response): Promise<RendererAuthResult> {
  const payload = await response.json().catch(() => ({})) as { url?: string | null; error?: string }
  const url = typeof payload.url === 'string' ? payload.url : null
  const error = typeof payload.error === 'string' ? payload.error : readAuthErrorFromUrl(url)
  return {
    ok: response.ok && !error,
    status: response.status,
    url,
    ...(error ? { error } : {}),
  }
}

export async function signInWithCredentials(
  options: RendererCredentialSignInOptions,
): Promise<RendererAuthResult> {
  const csrfToken = await getAuthCsrfToken()
  const body = new URLSearchParams({
    csrfToken,
    username: options.username,
    password: options.password,
    callbackUrl: options.callbackUrl || '/',
    json: 'true',
  })

  const response = await apiFetch(withQuery(authRoutes.login, { json: true }), {
    method: 'POST',
    headers: FORM_HEADERS,
    body,
    cache: 'no-store',
  })

  return readAuthResult(response)
}

export async function signOutRendererSession(options?: {
  callbackUrl?: string
}): Promise<RendererAuthResult> {
  const csrfToken = await getAuthCsrfToken()
  const body = new URLSearchParams({
    csrfToken,
    callbackUrl: options?.callbackUrl || '/',
    json: 'true',
  })

  const response = await apiFetch(withQuery(authRoutes.logout, { json: true }), {
    method: 'POST',
    headers: FORM_HEADERS,
    body,
    cache: 'no-store',
  })

  return readAuthResult(response)
}
