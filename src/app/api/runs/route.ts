import { apiHandler } from '@/lib/api-errors'
import { handleCreateRunRequest, handleListRunsRequest } from '@engine/services/run-route-service'

export const GET = apiHandler(async (request: Request) => {
  return handleListRunsRequest(request)
})

export const POST = apiHandler(async (request: Request) => {
  return handleCreateRunRequest(request)
})

