import { apiHandler } from '@/lib/api-errors'
import { handleRetryRunStepRequest } from '@engine/services/run-route-service'

export const POST = apiHandler(async (
  request: Request,
  context: { params: Promise<{ runId: string; stepKey: string }> },
) => {
  const { runId, stepKey } = await context.params
  return handleRetryRunStepRequest(request, runId, stepKey)
})
