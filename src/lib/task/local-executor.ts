import type { TaskJobLike, TaskJobOptions } from '@shared/contracts/task-job'
import { createScopedLogger } from '@/lib/logging/core'
import type { QueueType, TaskJobData } from './types'
import { getQueueNameByType, getQueueTypeByTaskType } from './queue-contract'
import { runImageTaskJob } from '../workers/image.worker'
import { runTextTaskJob } from '../workers/text.worker'
import { runVideoTaskJob } from '../workers/video.worker'
import { runVoiceTaskJob } from '../workers/voice.worker'

type LocalTaskStatus = 'queued' | 'running' | 'delayed'

type LocalTaskState = {
  id: string
  data: TaskJobData
  queueType: QueueType
  queueName: string
  opts: TaskJobOptions
  attemptsMade: number
  status: LocalTaskStatus
  timer: ReturnType<typeof setTimeout> | null
}

type LocalTaskJob = TaskJobLike<TaskJobData> & {
  id: string
  name: string
}

type LocalExecutorStore = {
  jobs: Map<string, LocalTaskState>
  queues: Record<QueueType, string[]>
  active: Record<QueueType, number>
  draining: Set<QueueType>
}

type GlobalLocalExecutor = typeof globalThis & {
  __waoowaooLocalTaskExecutor?: LocalExecutorStore
}

const logger = createScopedLogger({ module: 'task.local-executor' })

const QUEUE_CONCURRENCY: Record<QueueType, number> = {
  image: Number.parseInt(process.env.QUEUE_CONCURRENCY_IMAGE || '20', 10) || 20,
  video: Number.parseInt(process.env.QUEUE_CONCURRENCY_VIDEO || '4', 10) || 4,
  voice: Number.parseInt(process.env.QUEUE_CONCURRENCY_VOICE || '10', 10) || 10,
  text: Number.parseInt(process.env.QUEUE_CONCURRENCY_TEXT || '10', 10) || 10,
}

function getStore() {
  const runtimeGlobal = globalThis as GlobalLocalExecutor
  if (!runtimeGlobal.__waoowaooLocalTaskExecutor) {
    runtimeGlobal.__waoowaooLocalTaskExecutor = {
      jobs: new Map<string, LocalTaskState>(),
      queues: {
        image: [],
        video: [],
        voice: [],
        text: [],
      },
      active: {
        image: 0,
        video: 0,
        voice: 0,
        text: 0,
      },
      draining: new Set<QueueType>(),
    }
  }
  return runtimeGlobal.__waoowaooLocalTaskExecutor
}

function buildLocalJob(state: LocalTaskState): LocalTaskJob {
  return {
    id: state.id,
    name: state.data.type,
    data: state.data,
    queueName: state.queueName,
    attemptsMade: state.attemptsMade,
    opts: state.opts,
  }
}

function clearStateTimer(state: LocalTaskState) {
  if (!state.timer) return
  clearTimeout(state.timer)
  state.timer = null
}

function removeQueuedReference(queueType: QueueType, taskId: string) {
  const store = getStore()
  const nextQueue = store.queues[queueType].filter((id) => id !== taskId)
  store.queues[queueType] = nextQueue
}

function deleteTaskState(taskId: string) {
  const store = getStore()
  const state = store.jobs.get(taskId)
  if (!state) return
  clearStateTimer(state)
  store.jobs.delete(taskId)
  removeQueuedReference(state.queueType, taskId)
}

function resolveAttempts(opts: TaskJobOptions) {
  const attempts = opts.attempts
  if (typeof attempts !== 'number' || !Number.isFinite(attempts)) return 1
  return Math.max(1, Math.floor(attempts))
}

function resolveBackoffMs(opts: TaskJobOptions, failedAttempt: number) {
  const backoff = opts.backoff
  if (typeof backoff === 'number' && Number.isFinite(backoff) && backoff > 0) {
    return Math.floor(backoff)
  }
  if (!backoff || typeof backoff !== 'object') return 0

  const backoffRecord = backoff as { type?: unknown; delay?: unknown }
  const baseDelay = typeof backoffRecord.delay === 'number' && Number.isFinite(backoffRecord.delay)
    ? Math.max(0, Math.floor(backoffRecord.delay))
    : 0
  if (baseDelay <= 0) return 0

  const type = typeof backoffRecord.type === 'string' ? backoffRecord.type : 'fixed'
  if (type === 'exponential') {
    return baseDelay * Math.pow(2, Math.max(0, failedAttempt - 1))
  }
  return baseDelay
}

function isUnrecoverableError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  return (error as { name?: string }).name === 'UnrecoverableError'
}

async function runProcessor(queueType: QueueType, job: LocalTaskJob) {
  switch (queueType) {
    case 'image':
      return await runImageTaskJob(job)
    case 'video':
      return await runVideoTaskJob(job)
    case 'voice':
      return await runVoiceTaskJob(job)
    case 'text':
    default:
      return await runTextTaskJob(job)
  }
}

function scheduleDrain(queueType: QueueType) {
  const store = getStore()
  if (store.draining.has(queueType)) return

  store.draining.add(queueType)
  setImmediate(() => {
    store.draining.delete(queueType)
    void drainQueue(queueType)
  })
}

function scheduleRetry(state: LocalTaskState) {
  const failedAttempt = state.attemptsMade + 1
  const delayMs = resolveBackoffMs(state.opts, failedAttempt)
  state.attemptsMade = failedAttempt
  clearStateTimer(state)

  if (delayMs > 0) {
    state.status = 'delayed'
    state.timer = setTimeout(() => {
      state.timer = null
      if (!getStore().jobs.has(state.id)) return
      state.status = 'queued'
      getStore().queues[state.queueType].push(state.id)
      scheduleDrain(state.queueType)
    }, delayMs)
    return
  }

  state.status = 'queued'
  getStore().queues[state.queueType].push(state.id)
}

async function executeTask(state: LocalTaskState) {
  const store = getStore()
  const job = buildLocalJob(state)
  try {
    await runProcessor(state.queueType, job)
    deleteTaskState(state.id)
  } catch (error) {
    if (!store.jobs.has(state.id)) {
      return
    }

    const maxAttempts = resolveAttempts(state.opts)
    const failedAttempt = state.attemptsMade + 1
    const shouldRetry = !isUnrecoverableError(error) && failedAttempt < maxAttempts

    if (shouldRetry) {
      logger.warn({
        action: 'task.local.retry',
        message: '本地任务执行失败，进入重试队列',
        taskId: state.id,
        details: {
          queue: state.queueName,
          failedAttempt,
          maxAttempts,
        },
      })
      scheduleRetry(state)
    } else {
      deleteTaskState(state.id)
    }
  } finally {
    store.active[state.queueType] = Math.max(0, store.active[state.queueType] - 1)
    scheduleDrain(state.queueType)
  }
}

async function drainQueue(queueType: QueueType) {
  const store = getStore()
  while (store.active[queueType] < QUEUE_CONCURRENCY[queueType]) {
    const taskId = store.queues[queueType].shift()
    if (!taskId) return

    const state = store.jobs.get(taskId)
    if (!state || state.status !== 'queued') {
      continue
    }

    state.status = 'running'
    clearStateTimer(state)
    store.active[queueType] += 1
    void executeTask(state)
  }
}

export async function enqueueLocalTaskJob(data: TaskJobData, opts: TaskJobOptions) {
  const store = getStore()
  const existing = store.jobs.get(data.taskId)
  if (existing) {
    return buildLocalJob(existing)
  }

  const queueType = getQueueTypeByTaskType(data.type)
  const state: LocalTaskState = {
    id: data.taskId,
    data,
    queueType,
    queueName: getQueueNameByType(queueType),
    opts,
    attemptsMade: 0,
    status: 'queued',
    timer: null,
  }

  store.jobs.set(data.taskId, state)
  store.queues[queueType].push(data.taskId)
  scheduleDrain(queueType)

  logger.info({
    action: 'task.local.enqueue',
    message: '任务已进入本地执行器',
    taskId: data.taskId,
    details: {
      queue: state.queueName,
      taskType: data.type,
    },
  })

  return buildLocalJob(state)
}

export async function removeLocalTaskJob(taskId: string) {
  const state = getStore().jobs.get(taskId)
  if (!state) return false
  if (state.status === 'running') return false
  deleteTaskState(taskId)
  return true
}

export async function isLocalTaskJobAlive(taskId: string) {
  const state = getStore().jobs.get(taskId)
  if (!state) return false
  return state.status === 'queued' || state.status === 'running' || state.status === 'delayed'
}
