import { apiHandler } from '@/lib/api-errors'
import { handleTaskTargetStatesRequest } from '@engine/services/task-target-state-route-service'

export const POST = apiHandler(async (request: Request) => {
  return handleTaskTargetStatesRequest(request)
})

