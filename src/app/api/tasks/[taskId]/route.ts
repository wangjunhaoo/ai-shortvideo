import { apiHandler } from '@/lib/api-errors'
import { handleTaskCancelRequest, handleTaskDetailRequest } from '@engine/services/task-route-service'

export const GET = apiHandler(async (
  request: Request,
  context: { params: Promise<{ taskId: string }> },
) => {
  const { taskId } = await context.params
  return handleTaskDetailRequest(request, taskId)
})

export const DELETE = apiHandler(async (
  _request: Request,
  context: { params: Promise<{ taskId: string }> },
) => {
  const { taskId } = await context.params
  return handleTaskCancelRequest(taskId)
})

