import { apiHandler } from '@/lib/api-errors'
import { handleRunCancelRequest } from '@engine/services/run-route-service'

export const POST = apiHandler(async (
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) => {
  const { runId } = await context.params
  return handleRunCancelRequest(runId)
})


