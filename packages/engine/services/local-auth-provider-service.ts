import crypto from 'node:crypto'
import { cookies as readCookies } from 'next/headers'
import { checkRateLimit, getClientIp, AUTH_LOGIN_LIMIT } from '@/lib/rate-limit'
import { logAuthAction } from '@/lib/logging/semantic'
import {
  authenticateUserCredentials,
  type AuthenticatedUser,
} from '@engine/services/auth-login-service'

const SESSION_COOKIE_NAME = 'waoowaoo.session'
const CSRF_COOKIE_NAME = 'waoowaoo.csrf'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const CSRF_MAX_AGE_SECONDS = 60 * 10

type LocalAuthSessionPayload = {
  userId: string
  name: string
  iat: number
  exp: number
}

export interface LocalAuthSession {
  user: {
    id: string
    name: string
    email: null
  }
  expires: string
}

type CookieOptions = {
  httpOnly?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
  secure?: boolean
  path?: string
  maxAge?: number
  expires?: Date
}

function getAuthCookieSecure() {
  return (process.env.APP_BASE_URL || '').startsWith('https://')
}

function getAuthSecret() {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.API_ENCRYPTION_KEY || ''
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET_MISSING')
  }
  return 'waoowaoo-local-auth-dev-secret'
}

function createSignature(payload: string) {
  return crypto.createHmac('sha256', getAuthSecret()).update(payload).digest('base64url')
}

function encodeSignedPayload(payload: LocalAuthSessionPayload) {
  const serialized = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const signature = createSignature(serialized)
  return `${serialized}.${signature}`
}

function decodeSignedPayload(token: string): LocalAuthSessionPayload | null {
  const [serialized, signature] = token.split('.')
  if (!serialized || !signature) return null

  const expectedSignature = createSignature(serialized)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)
  if (
    signatureBuffer.length !== expectedBuffer.length
    || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(serialized, 'base64url').toString('utf8')) as LocalAuthSessionPayload
    if (!payload?.userId || !payload?.name || !payload?.exp) {
      return null
    }
    if (payload.exp * 1000 <= Date.now()) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

function buildSessionPayload(user: AuthenticatedUser): LocalAuthSessionPayload {
  const issuedAt = Math.floor(Date.now() / 1000)
  return {
    userId: user.id,
    name: user.name,
    iat: issuedAt,
    exp: issuedAt + SESSION_MAX_AGE_SECONDS,
  }
}

function toSession(payload: LocalAuthSessionPayload): LocalAuthSession {
  return {
    user: {
      id: payload.userId,
      name: payload.name,
      email: null,
    },
    expires: new Date(payload.exp * 1000).toISOString(),
  }
}

function getRequestOrigin(request: Request) {
  return new URL(request.url).origin
}

function buildCallbackUrl(request: Request, callbackUrl: string | null | undefined) {
  const raw = callbackUrl?.trim() || '/'
  try {
    return new URL(raw, getRequestOrigin(request)).toString()
  } catch {
    return new URL('/', getRequestOrigin(request)).toString()
  }
}

function buildAuthErrorUrl(request: Request, error: string, callbackUrl?: string | null) {
  const signInUrl = new URL('/auth/signin', getRequestOrigin(request))
  signInUrl.searchParams.set('error', error)
  if (callbackUrl?.trim()) {
    signInUrl.searchParams.set('callbackUrl', callbackUrl.trim())
  }
  return signInUrl.toString()
}

function wantsJsonResponse(request: Request) {
  return new URL(request.url).searchParams.get('json') === 'true'
}

function serializeCookie(name: string, value: string, options: CookieOptions = {}) {
  const parts = [`${name}=${value}`]
  parts.push(`Path=${options.path || '/'}`)
  if (typeof options.maxAge === 'number') {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`)
  }
  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`)
  }
  if (options.httpOnly) {
    parts.push('HttpOnly')
  }
  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`)
  }
  if (options.secure) {
    parts.push('Secure')
  }
  return parts.join('; ')
}

function appendSetCookie(response: Response, name: string, value: string, options: CookieOptions = {}) {
  response.headers.append('Set-Cookie', serializeCookie(name, value, options))
}

function applySessionCookie(response: Response, session: LocalAuthSessionPayload) {
  appendSetCookie(response, SESSION_COOKIE_NAME, encodeSignedPayload(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: getAuthCookieSecure(),
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires: new Date(session.exp * 1000),
  })
}

function clearSessionCookie(response: Response) {
  appendSetCookie(response, SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: getAuthCookieSecure(),
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })
}

function applyCsrfCookie(response: Response, csrfToken: string) {
  appendSetCookie(response, CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: getAuthCookieSecure(),
    path: '/',
    maxAge: CSRF_MAX_AGE_SECONDS,
  })
}

function clearCsrfCookie(response: Response) {
  appendSetCookie(response, CSRF_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: getAuthCookieSecure(),
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })
}

function createJsonResponse(payload: unknown, status = 200) {
  return Response.json(payload, { status })
}

function createRedirectResponse(url: string) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
    },
  })
}

function readRequestCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get('cookie') || ''
  if (!cookieHeader) return ''
  const prefix = `${name}=`
  for (const chunk of cookieHeader.split(';')) {
    const trimmed = chunk.trim()
    if (trimmed.startsWith(prefix)) {
      return trimmed.slice(prefix.length)
    }
  }
  return ''
}

async function readRequestCsrfToken(request: Request) {
  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    return String(formData.get('csrfToken') || '')
  }

  const body = await request.json().catch(() => null) as { csrfToken?: string } | null
  return body?.csrfToken || ''
}

async function readLoginRequestBody(request: Request) {
  const formData = await request.formData()
  return {
    username: String(formData.get('username') || ''),
    password: String(formData.get('password') || ''),
    callbackUrl: String(formData.get('callbackUrl') || ''),
    csrfToken: String(formData.get('csrfToken') || ''),
  }
}

async function readLogoutRequestBody(request: Request) {
  const formData = await request.formData()
  return {
    callbackUrl: String(formData.get('callbackUrl') || ''),
    csrfToken: String(formData.get('csrfToken') || ''),
  }
}

async function hasValidCsrfToken(request: Request, postedToken?: string) {
  const requestToken = postedToken ?? await readRequestCsrfToken(request)
  const cookieToken = readRequestCookie(request, CSRF_COOKIE_NAME)
  return Boolean(requestToken) && Boolean(cookieToken) && requestToken === cookieToken
}

export async function readLocalAuthSession(request?: Request) {
  const sessionToken = request
    ? readRequestCookie(request, SESSION_COOKIE_NAME)
    : (await readCookies()).get(SESSION_COOKIE_NAME)?.value || ''
  const payload = decodeSignedPayload(sessionToken)
  return payload ? toSession(payload) : null
}

export async function handleLocalAuthSessionRequest(request?: Request) {
  const session = await readLocalAuthSession(request)
  return createJsonResponse(session ?? null)
}

export async function handleLocalAuthCsrfRequest() {
  const csrfToken = crypto.randomBytes(24).toString('hex')
  const response = createJsonResponse({ csrfToken })
  applyCsrfCookie(response, csrfToken)
  return response
}

export async function handleLocalAuthLoginRequest(request: Request) {
  const { username, password, callbackUrl, csrfToken } = await readLoginRequestBody(request)
  const wantsJson = wantsJsonResponse(request)
  const successUrl = buildCallbackUrl(request, callbackUrl)

  if (!await hasValidCsrfToken(request, csrfToken)) {
    const errorUrl = buildAuthErrorUrl(request, 'CsrfTokenMismatch', callbackUrl)
    return wantsJson
      ? createJsonResponse({ url: errorUrl, error: 'CsrfTokenMismatch' }, 400)
      : createRedirectResponse(errorUrl)
  }

  const ip = getClientIp(request)
  const rateResult = await checkRateLimit('auth:login', ip, AUTH_LOGIN_LIMIT)
  if (rateResult.limited) {
    logAuthAction('LOGIN', username || 'unknown', { error: 'Rate limited', ip })
    const errorUrl = buildAuthErrorUrl(request, 'RateLimited', callbackUrl)
    const response = wantsJson
      ? createJsonResponse({ url: errorUrl, error: 'RateLimited' }, 429)
      : createRedirectResponse(errorUrl)
    response.headers.set('Retry-After', String(rateResult.retryAfterSeconds))
    return response
  }

  const user = await authenticateUserCredentials({ username, password })
  if (!user) {
    const errorUrl = buildAuthErrorUrl(request, 'CredentialsSignin', callbackUrl)
    return wantsJson
      ? createJsonResponse({ url: errorUrl, error: 'CredentialsSignin' }, 401)
      : createRedirectResponse(errorUrl)
  }

  const response = wantsJson
    ? createJsonResponse({ url: successUrl })
    : createRedirectResponse(successUrl)
  applySessionCookie(response, buildSessionPayload(user))
  clearCsrfCookie(response)
  return response
}

export async function handleLocalAuthLogoutRequest(request: Request) {
  const { callbackUrl, csrfToken } = await readLogoutRequestBody(request)
  const wantsJson = wantsJsonResponse(request)
  const successUrl = buildCallbackUrl(request, callbackUrl)

  if (!await hasValidCsrfToken(request, csrfToken)) {
    const errorUrl = buildAuthErrorUrl(request, 'CsrfTokenMismatch', callbackUrl)
    return wantsJson
      ? createJsonResponse({ url: errorUrl, error: 'CsrfTokenMismatch' }, 400)
      : createRedirectResponse(errorUrl)
  }

  const response = wantsJson
    ? createJsonResponse({ url: successUrl })
    : createRedirectResponse(successUrl)
  clearSessionCookie(response)
  clearCsrfCookie(response)
  return response
}
