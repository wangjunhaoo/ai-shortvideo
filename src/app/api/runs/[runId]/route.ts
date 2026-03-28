import { apiHandler } from '@/lib/api-errors'
import { handleRunSnapshotRequest } from '@engine/services/run-route-service'

export const GET = apiHandler(async (
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) => {
  const { runId } = await context.params
  return handleRunSnapshotRequest(runId)
})


