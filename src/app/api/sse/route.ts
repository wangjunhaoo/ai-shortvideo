import { apiHandler } from '@/lib/api-errors'
import { handleSseRequest } from '@engine/services/sse-route-service'

export const GET = apiHandler(async (request: Request) => {
  return handleSseRequest(request)
})

