import { ApiError } from '@/lib/api-errors'
import { withPrismaRetry } from '@/lib/prisma-retry'
import {
  isErrorResponse,
  requireProjectAuthLight,
  requireUserAuth,
} from '@engine/api-auth'
import { queryTaskTargetStates, type TaskTargetQuery } from '@/lib/task/state-service'

function normalizeTarget(input: unknown): TaskTargetQuery {
  const payload = input as Record<string, unknown>
  const targetType = typeof payload.targetType === 'string' ? payload.targetType.trim() : ''
  const targetId = typeof payload.targetId === 'string' ? payload.targetId.trim() : ''
  const types = Array.isArray(payload.types)
    ? payload.types.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : undefined

  if (!targetType || !targetId) {
    throw new ApiError('INVALID_PARAMS')
  }

  return {
    targetType,
    targetId,
    ...(types && types.length > 0 ? { types } : {}),
  }
}

export async function handleTaskTargetStatesRequest(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    throw new ApiError('INVALID_PARAMS')
  }

  const projectId = typeof body?.projectId === 'string' ? body.projectId.trim() : ''
  const targetsRaw = Array.isArray(body?.targets) ? body.targets : null

  if (!projectId || !targetsRaw || targetsRaw.length > 500) {
    throw new ApiError('INVALID_PARAMS')
  }

  const targets = targetsRaw.map(normalizeTarget)
  if (targets.length === 0) {
    return Response.json({ states: [] })
  }

  let userId: string
  if (projectId === 'global-asset-hub') {
    const authResult = await requireUserAuth()
    if (isErrorResponse(authResult)) return authResult
    userId = authResult.session.user.id
  } else {
    const authResult = await requireProjectAuthLight(projectId)
    if (isErrorResponse(authResult)) return authResult
    userId = authResult.session.user.id
  }

  const states = await withPrismaRetry(() =>
    queryTaskTargetStates({
      projectId,
      userId,
      targets,
    }),
  )

  return Response.json({ states })
}
