import { ApiError } from '@/lib/api-errors'
import { getSignedObjectUrl } from '@/lib/storage'

const DEFAULT_EXPIRES_SECONDS = 3600

export async function handleStorageSignRequest(requestUrl: string) {
  const { searchParams } = new URL(requestUrl)
  const key = searchParams.get('key')
  const expiresRaw = searchParams.get('expires')

  if (!key) {
    throw new ApiError('INVALID_PARAMS')
  }

  const expires = expiresRaw ? Number.parseInt(expiresRaw, 10) : DEFAULT_EXPIRES_SECONDS
  const ttl = Number.isFinite(expires) && expires > 0 ? expires : DEFAULT_EXPIRES_SECONDS
  const signedUrl = await getSignedObjectUrl(key, ttl)
  return Response.redirect(signedUrl)
}
