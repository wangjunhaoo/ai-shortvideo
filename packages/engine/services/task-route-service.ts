import { ApiError } from '@/lib/api-errors'
import { normalizeTaskError } from '@/lib/errors/normalize'
import { requireUserAuth, isErrorResponse } from '@engine/api-auth'
import { listTaskLifecycleEvents, publishTaskEvent } from '@/lib/task/publisher'
import { removeTaskJob } from '@/lib/task/queues'
import { cancelTask, dismissFailedTasks, getTaskById, queryTasks } from '@/lib/task/service'
import { TASK_EVENT_TYPE, type TaskStatus } from '@/lib/task/types'

function withTaskError(task: Awaited<ReturnType<typeof queryTasks>>[number]) {
  const error = normalizeTaskError(task.errorCode, task.errorMessage)
  return {
    ...task,
    error,
  }
}

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

export async function handleListTasksRequest(request: Request) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const searchParams = new URL(request.url).searchParams
  const projectId = searchParams.get('projectId') || undefined
  const targetType = searchParams.get('targetType') || undefined
  const targetId = searchParams.get('targetId') || undefined
  const status = searchParams.getAll('status')
  const type = searchParams.getAll('type')
  const limit = Number.parseInt(searchParams.get('limit') || '50', 10)

  const tasks = await queryTasks({
    projectId,
    targetType,
    targetId,
    status: status.length ? (status as TaskStatus[]) : undefined,
    type: type.length ? type : undefined,
    limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50,
  })

  const filtered = tasks
    .filter((task) => task.userId === session.user.id)
    .map(withTaskError)

  return Response.json({ tasks: filtered })
}

export async function handleDismissTasksRequest(request: Request) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = await request.json()
  const { taskIds } = body as { taskIds?: string[] }

  if (!Array.isArray(taskIds) || taskIds.length === 0 || taskIds.length > 200) {
    throw new ApiError('INVALID_PARAMS')
  }

  const count = await dismissFailedTasks(taskIds, session.user.id)
  return Response.json({ success: true, dismissed: count })
}

export async function handleTaskDetailRequest(
  request: Request,
  taskId: string,
) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const task = await getTaskById(taskId)
  if (!task || task.userId !== session.user.id) {
    throw new ApiError('NOT_FOUND')
  }

  const searchParams = new URL(request.url).searchParams
  const includeEvents = searchParams.get('includeEvents') === '1'
  const eventsLimitRaw = Number.parseInt(searchParams.get('eventsLimit') || '500', 10)
  const eventsLimit = Number.isFinite(eventsLimitRaw) ? Math.min(Math.max(eventsLimitRaw, 1), 5000) : 500
  const events = includeEvents ? await listTaskLifecycleEvents(taskId, eventsLimit) : null

  return Response.json({
    task: {
      ...task,
      error: normalizeTaskError(task.errorCode, task.errorMessage),
    },
    ...(events ? { events } : {}),
  })
}

export async function handleTaskCancelRequest(taskId: string) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const task = await getTaskById(taskId)
  if (!task || task.userId !== session.user.id) {
    throw new ApiError('NOT_FOUND')
  }

  const { task: updatedTask, cancelled } = await cancelTask(taskId)
  if (!updatedTask) {
    throw new ApiError('NOT_FOUND')
  }

  if (cancelled) {
    await removeTaskJob(taskId).catch(() => false)
    await publishTaskEvent({
      taskId: updatedTask.id,
      projectId: updatedTask.projectId,
      userId: updatedTask.userId,
      type: TASK_EVENT_TYPE.FAILED,
      taskType: updatedTask.type,
      targetType: updatedTask.targetType,
      targetId: updatedTask.targetId,
      episodeId: updatedTask.episodeId || null,
      payload: {
        ...toObject(updatedTask.payload),
        stage: 'cancelled',
        stageLabel: '任务已取消',
        cancelled: true,
        message: updatedTask.errorMessage || 'Task cancelled by user',
      },
      persist: false,
    })
  }

  return Response.json({
    success: true,
    cancelled,
    task: {
      ...updatedTask,
      error: normalizeTaskError(updatedTask.errorCode, updatedTask.errorMessage),
    },
  })
}
