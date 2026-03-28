import { apiFetch } from '@/lib/api-fetch'

export const JSON_HEADERS = {
  'Content-Type': 'application/json',
} as const

export function rendererApiRequest(input: RequestInfo | URL, init?: RequestInit) {
  return apiFetch(input, init)
}
