import { ApiError, getRequestId } from '@/lib/api-errors'
import { isErrorResponse, requireUserAuth } from '@engine/api-auth'
import { resolveRequiredTaskLocale } from '@/lib/task/resolve-locale'
import { cancelTask } from '@/lib/task/service'
import { publishRunEvent } from '@/lib/run-runtime/publisher'
import { retryRunStep } from '@engine/services/run-retry-service'
import {
  createRun,
  getRunById,
  getRunSnapshot,
  listRunEventsAfterSeq,
  listRuns,
  requestRunCancel,
} from '@/lib/run-runtime/service'
import { RUN_EVENT_TYPE, RUN_STATUS, type RunStatus } from '@/lib/run-runtime/types'

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function normalizeStatus(value: string | null): RunStatus | null {
  if (!value) return null
  if (
    value === RUN_STATUS.QUEUED
    || value === RUN_STATUS.RUNNING
    || value === RUN_STATUS.COMPLETED
    || value === RUN_STATUS.FAILED
    || value === RUN_STATUS.CANCELING
    || value === RUN_STATUS.CANCELED
  ) return value
  return null
}

function normalizeStatuses(values: string[]): RunStatus[] {
  const next: RunStatus[] = []
  for (const value of values) {
    const normalized = normalizeStatus(readString(value))
    if (!normalized) continue
    if (!next.includes(normalized)) {
      next.push(normalized)
    }
  }
  return next
}

export async function handleListRunsRequest(request: Request) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult
  const query = new URL(request.url).searchParams
  const projectId = readString(query.get('projectId'))
  const workflowType = readString(query.get('workflowType'))
  const targetType = readString(query.get('targetType'))
  const targetId = readString(query.get('targetId'))
  const episodeId = readString(query.get('episodeId'))
  const statuses = normalizeStatuses(query.getAll('status'))
  const limitRaw = Number.parseInt(query.get('limit') || '50', 10)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50
  const runs = await listRuns({
    userId: session.user.id,
    projectId: projectId || undefined,
    workflowType: workflowType || undefined,
    targetType: targetType || undefined,
    targetId: targetId || undefined,
    episodeId: episodeId || undefined,
    statuses: statuses.length > 0 ? statuses : undefined,
    limit,
  })
  return Response.json({ runs })
}

export async function handleCreateRunRequest(request: Request) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = body as Record<string, unknown>
  const projectId = readString(payload.projectId)
  const workflowType = readString(payload.workflowType)
  const targetType = readString(payload.targetType)
  const targetId = readString(payload.targetId)
  const episodeId = readString(payload.episodeId)
  const taskType = readString(payload.taskType)
  const taskId = readString(payload.taskId)
  const input = payload.input && typeof payload.input === 'object' && !Array.isArray(payload.input)
    ? (payload.input as Record<string, unknown>)
    : null

  if (!projectId || !workflowType || !targetType || !targetId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const run = await createRun({
    userId: session.user.id,
    projectId,
    episodeId,
    workflowType,
    taskType,
    taskId,
    targetType,
    targetId,
    input,
  })

  return Response.json({
    success: true,
    runId: run.id,
    run,
  })
}

export async function handleRunSnapshotRequest(runId: string) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const snapshot = await getRunSnapshot(runId)
  if (!snapshot || snapshot.run.userId !== session.user.id) {
    throw new ApiError('NOT_FOUND')
  }

  return Response.json(snapshot)
}

export async function handleRunCancelRequest(runId: string) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const run = await getRunById(runId)
  if (!run || run.userId !== session.user.id) {
    throw new ApiError('NOT_FOUND')
  }

  const cancelledRun = await requestRunCancel({
    runId,
    userId: session.user.id,
  })
  if (!cancelledRun) {
    throw new ApiError('NOT_FOUND')
  }

  if (cancelledRun.taskId) {
    await cancelTask(cancelledRun.taskId, 'Run cancelled by user')
  }

  if (
    cancelledRun.status === RUN_STATUS.CANCELING
    || cancelledRun.status === RUN_STATUS.CANCELED
  ) {
    await publishRunEvent({
      runId: cancelledRun.id,
      projectId: cancelledRun.projectId,
      userId: cancelledRun.userId,
      eventType: RUN_EVENT_TYPE.RUN_CANCELED,
      payload: {
        message: 'Run cancelled by user',
      },
    })
  }

  return Response.json({
    success: true,
    run: cancelledRun,
  })
}

export async function handleRunEventsRequest(request: Request, runId: string) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult
  const searchParams = new URL(request.url).searchParams
  const afterSeqRaw = Number.parseInt(searchParams.get('afterSeq') || '0', 10)
  const limitRaw = Number.parseInt(searchParams.get('limit') || '200', 10)
  const afterSeq = Number.isFinite(afterSeqRaw) ? Math.max(0, afterSeqRaw) : 0
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 2000) : 200

  const events = await listRunEventsAfterSeq({
    runId,
    userId: session.user.id,
    afterSeq,
    limit,
  })

  return Response.json({
    runId,
    afterSeq,
    events,
  })
}

export async function handleRetryRunStepRequest(
  request: Request,
  runId: string,
  rawStepKey: string,
) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult

  const stepKey = decodeURIComponent(rawStepKey || '').trim()
  if (!runId || !stepKey) {
    throw new ApiError('INVALID_PARAMS')
  }

  const body = await request.json().catch(() => null)
  const payload = await retryRunStep({
    runId,
    stepKey,
    userId: authResult.session.user.id,
    locale: resolveRequiredTaskLocale(request, body),
    requestId: getRequestId(request),
    body,
  })

  return Response.json(payload)
}
