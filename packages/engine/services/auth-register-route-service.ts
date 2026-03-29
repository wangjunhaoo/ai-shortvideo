import { logAuthAction } from '@/lib/logging/semantic'
import { checkRateLimit, getClientIp, AUTH_REGISTER_LIMIT } from '@/lib/rate-limit'
import { registerUser } from '@engine/services/auth-register-service'

export async function handleRegisterUserRequest(request: Request) {
  const ip = getClientIp(request)
  const rateResult = await checkRateLimit('auth:register', ip, AUTH_REGISTER_LIMIT)
  if (rateResult.limited) {
    logAuthAction('REGISTER', 'unknown', { error: 'Rate limited', ip })
    return Response.json(
      { success: false, message: `请求过于频繁，请 ${rateResult.retryAfterSeconds} 秒后再试` },
      {
        status: 429,
        headers: { 'Retry-After': String(rateResult.retryAfterSeconds) },
      },
    )
  }

  const body = await request.json()
  const payload = await registerUser({
    name: typeof body?.name === 'string' ? body.name : '',
    password: typeof body?.password === 'string' ? body.password : '',
  })

  return Response.json(payload, { status: 201 })
}
