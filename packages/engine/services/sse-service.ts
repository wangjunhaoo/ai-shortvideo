import { coerceTaskIntent } from '@/lib/task/intent'
import { TASK_EVENT_TYPE, TASK_SSE_EVENT_TYPE, type SSEEvent } from '@/lib/task/types'
import { prisma } from '@engine/prisma'

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export async function listActiveLifecycleSnapshot(params: {
  projectId: string
  episodeId: string | null
  userId: string
  limit?: number
}): Promise<SSEEvent[]> {
  const limit = params.limit || 500
  const rows = await prisma.task.findMany({
    where: {
      projectId: params.projectId,
      userId: params.userId,
      status: {
        in: ['queued', 'processing'],
      },
      ...(params.episodeId ? { episodeId: params.episodeId } : {}),
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: limit,
    select: {
      id: true,
      type: true,
      targetType: true,
      targetId: true,
      episodeId: true,
      userId: true,
      status: true,
      progress: true,
      payload: true,
      updatedAt: true,
    },
  })

  return rows.map((row): SSEEvent => {
    const payload = asObject(row.payload)
    const payloadUi = asObject(payload?.ui)
    const lifecycleType = row.status === 'queued'
      ? TASK_EVENT_TYPE.CREATED
      : TASK_EVENT_TYPE.PROCESSING
    const eventPayload: Record<string, unknown> = {
      ...(payload || {}),
      lifecycleType,
      intent: coerceTaskIntent(payloadUi?.intent ?? payload?.intent, row.type),
      progress: typeof row.progress === 'number' ? row.progress : null,
    }

    return {
      id: `snapshot:${row.id}:${row.updatedAt.getTime()}`,
      type: TASK_SSE_EVENT_TYPE.LIFECYCLE,
      taskId: row.id,
      projectId: params.projectId,
      userId: row.userId,
      ts: row.updatedAt.toISOString(),
      taskType: row.type,
      targetType: row.targetType,
      targetId: row.targetId,
      episodeId: row.episodeId,
      payload: eventPayload,
    }
  })
}
