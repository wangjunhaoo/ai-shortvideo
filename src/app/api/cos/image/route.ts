import { apiHandler } from '@/lib/api-errors'
import { handleCosImageRequest } from '@engine/services/cos-image-route-service'

export const GET = apiHandler(async (request: Request) => {
  return handleCosImageRequest(request.url)
})
