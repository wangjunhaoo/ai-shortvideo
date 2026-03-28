import { apiHandler } from '@/lib/api-errors'
import { handleStorageSignRequest } from '@engine/services/storage-sign-route-service'

export const GET = apiHandler(async (request: Request) => {
  return handleStorageSignRequest(request.url)
})
