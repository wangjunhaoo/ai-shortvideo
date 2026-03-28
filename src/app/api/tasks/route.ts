import { apiHandler } from '@/lib/api-errors'
import { handleListTasksRequest } from '@engine/services/task-route-service'

export const GET = apiHandler(async (request: Request) => {
  return handleListTasksRequest(request)
})

