import type { JobsOptions, Queue } from 'bullmq'
import { isDesktopLocalTasksEnabled } from '@/lib/runtime-mode'
import type { QueueType, TaskType, TaskJobData } from './types'
import { QUEUE_NAME, getQueueTypeByTaskType, resolveTaskJobOptions } from './queue-contract'

export { QUEUE_NAME, getQueueTypeByTaskType } from './queue-contract'

type TaskQueue = Queue<TaskJobData, unknown, TaskType>

let imageQueueRef: Promise<TaskQueue> | null = null
let videoQueueRef: Promise<TaskQueue> | null = null
let voiceQueueRef: Promise<TaskQueue> | null = null
let textQueueRef: Promise<TaskQueue> | null = null

async function createTaskQueue(name: string): Promise<TaskQueue> {
  const [{ Queue }, { queueConnection }] = await Promise.all([
    import('bullmq'),
    import('../redis'),
  ])

  return new Queue<TaskJobData, unknown, TaskType>(name, {
    connection: queueConnection,
  })
}

async function getImageQueue(): Promise<TaskQueue> {
  imageQueueRef ||= createTaskQueue(QUEUE_NAME.IMAGE)
  return await imageQueueRef
}

async function getVideoQueue(): Promise<TaskQueue> {
  videoQueueRef ||= createTaskQueue(QUEUE_NAME.VIDEO)
  return await videoQueueRef
}

async function getVoiceQueue(): Promise<TaskQueue> {
  voiceQueueRef ||= createTaskQueue(QUEUE_NAME.VOICE)
  return await voiceQueueRef
}

async function getTextQueue(): Promise<TaskQueue> {
  textQueueRef ||= createTaskQueue(QUEUE_NAME.TEXT)
  return await textQueueRef
}

export async function getAllTaskQueues(): Promise<TaskQueue[]> {
  return await Promise.all([getImageQueue(), getVideoQueue(), getVoiceQueue(), getTextQueue()])
}

async function getQueueByType(type: QueueType): Promise<TaskQueue> {
  switch (type) {
    case 'image':
      return await getImageQueue()
    case 'video':
      return await getVideoQueue()
    case 'voice':
      return await getVoiceQueue()
    case 'text':
    default:
      return await getTextQueue()
  }
}

export async function addTaskJob(data: TaskJobData, opts?: JobsOptions) {
  const resolvedOptions = resolveTaskJobOptions(data.taskId, data.type, opts)

  if (isDesktopLocalTasksEnabled()) {
    const { enqueueLocalTaskJob } = await import('./local-executor')
    return await enqueueLocalTaskJob(data, resolvedOptions)
  }

  const queueType = getQueueTypeByTaskType(data.type)
  const queue = await getQueueByType(queueType)
  return await queue.add(data.type, data, resolvedOptions)
}

export async function removeTaskJob(taskId: string) {
  if (isDesktopLocalTasksEnabled()) {
    const { removeLocalTaskJob } = await import('./local-executor')
    return await removeLocalTaskJob(taskId)
  }

  for (const queue of await getAllTaskQueues()) {
    const job = await queue.getJob(taskId)
    if (!job) continue
    await job.remove()
    return true
  }
  return false
}
