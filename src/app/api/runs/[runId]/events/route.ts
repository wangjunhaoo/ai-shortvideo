import { apiHandler } from '@/lib/api-errors'
import { handleRunEventsRequest } from '@engine/services/run-route-service'

export const GET = apiHandler(async (
  request: Request,
  context: { params: Promise<{ runId: string }> },
) => {
  const { runId } = await context.params
  return handleRunEventsRequest(request, runId)
})


