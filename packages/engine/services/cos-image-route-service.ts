import { ApiError } from '@/lib/api-errors'

export async function handleCosImageRequest(requestUrl: string) {
  const { searchParams } = new URL(requestUrl)
  const key = searchParams.get('key')
  const expires = searchParams.get('expires') || '3600'

  if (!key) {
    throw new ApiError('INVALID_PARAMS')
  }

  const location = `/api/storage/sign?key=${encodeURIComponent(key)}&expires=${encodeURIComponent(expires)}`
  return Response.redirect(new URL(location, requestUrl))
}
