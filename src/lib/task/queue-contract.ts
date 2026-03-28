import type { JobsOptions } from 'bullmq'
import { QueueType, TaskType, TASK_TYPE } from './types'

export const QUEUE_NAME = {
  IMAGE: 'waoowaoo-image',
  VIDEO: 'waoowaoo-video',
  VOICE: 'waoowaoo-voice',
  TEXT: 'waoowaoo-text',
} as const

export const defaultJobOptions: JobsOptions = {
  removeOnComplete: 500,
  removeOnFail: 500,
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2_000,
  },
}

const IMAGE_TYPES = new Set<TaskType>([
  TASK_TYPE.IMAGE_PANEL,
  TASK_TYPE.IMAGE_CHARACTER,
  TASK_TYPE.IMAGE_LOCATION,
  TASK_TYPE.PANEL_VARIANT,
  TASK_TYPE.MODIFY_ASSET_IMAGE,
  TASK_TYPE.REGENERATE_GROUP,
  TASK_TYPE.ASSET_HUB_IMAGE,
  TASK_TYPE.ASSET_HUB_MODIFY,
])

const VIDEO_TYPES = new Set<TaskType>([TASK_TYPE.VIDEO_PANEL, TASK_TYPE.LIP_SYNC])
const VOICE_TYPES = new Set<TaskType>([
  TASK_TYPE.VOICE_LINE,
  TASK_TYPE.VOICE_DESIGN,
  TASK_TYPE.ASSET_HUB_VOICE_DESIGN,
])

const SINGLE_ATTEMPT_TASK_TYPES = new Set<TaskType>([
  TASK_TYPE.STORY_TO_SCRIPT_RUN,
  TASK_TYPE.SCRIPT_TO_STORYBOARD_RUN,
])

export function getQueueTypeByTaskType(type: TaskType): QueueType {
  if (IMAGE_TYPES.has(type)) return 'image'
  if (VIDEO_TYPES.has(type)) return 'video'
  if (VOICE_TYPES.has(type)) return 'voice'
  return 'text'
}

export function getQueueNameByType(type: QueueType) {
  switch (type) {
    case 'image':
      return QUEUE_NAME.IMAGE
    case 'video':
      return QUEUE_NAME.VIDEO
    case 'voice':
      return QUEUE_NAME.VOICE
    case 'text':
    default:
      return QUEUE_NAME.TEXT
  }
}

export function resolveTaskJobOptions(taskId: string, taskType: TaskType, opts?: JobsOptions): JobsOptions {
  const priority = typeof opts?.priority === 'number' ? opts.priority : 0
  const attempts = SINGLE_ATTEMPT_TASK_TYPES.has(taskType)
    ? 1
    : (typeof opts?.attempts === 'number' ? opts.attempts : defaultJobOptions.attempts)

  return {
    ...defaultJobOptions,
    ...(opts || {}),
    jobId: taskId,
    priority,
    ...(attempts !== undefined ? { attempts } : {}),
  }
}
