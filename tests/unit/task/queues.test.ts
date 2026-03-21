import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TASK_TYPE, type TaskJobData } from '@/lib/task/types'

const queueState = vi.hoisted(() => ({
  calls: [] as Array<{
    queueName: string
    name: string
    data: TaskJobData
    opts?: Record<string, unknown>
  }>,
}))

vi.mock('bullmq', () => ({
  Queue: class {
    private queueName: string

    constructor(queueName: string) {
      this.queueName = queueName
    }

    async add(name: string, data: TaskJobData, opts?: Record<string, unknown>) {
      queueState.calls.push({
        queueName: this.queueName,
        name,
        data,
        opts,
      })
      return { id: `${this.queueName}-job-1` }
    }

    async getJob() {
      return null
    }
  },
}))

vi.mock('@/lib/redis', () => ({
  queueConnection: {},
}))

import { addTaskJob, getQueueTypeByTaskType } from '@/lib/task/queues'

function buildTaskData(type: TaskJobData['type']): TaskJobData {
  return {
    taskId: 'task-1',
    type,
    locale: 'zh',
    projectId: 'project-1',
    episodeId: 'episode-1',
    targetType: 'NovelPromotionPanel',
    targetId: 'panel-1',
    payload: {},
    userId: 'user-1',
  }
}

describe('task queues route and attempts', () => {
  beforeEach(() => {
    queueState.calls.length = 0
  })

  it('maps task type to queue type', () => {
    expect(getQueueTypeByTaskType(TASK_TYPE.IMAGE_PANEL)).toBe('image')
    expect(getQueueTypeByTaskType(TASK_TYPE.VIDEO_PANEL)).toBe('video')
    expect(getQueueTypeByTaskType(TASK_TYPE.VOICE_LINE)).toBe('voice')
    expect(getQueueTypeByTaskType(TASK_TYPE.STORY_TO_SCRIPT_RUN)).toBe('text')
  })

  it('routes IMAGE_PANEL to image queue and keeps explicit attempts', async () => {
    await addTaskJob(buildTaskData(TASK_TYPE.IMAGE_PANEL), {
      priority: 9,
      attempts: 3,
    })

    const call = queueState.calls[queueState.calls.length - 1]
    expect(call?.queueName).toBe('waoowaoo-image')
    expect(call?.name).toBe(TASK_TYPE.IMAGE_PANEL)
    expect(call?.opts).toMatchObject({
      jobId: 'task-1',
      priority: 9,
      attempts: 3,
    })
  })

  it('forces attempts=1 for STORY_TO_SCRIPT_RUN', async () => {
    await addTaskJob(buildTaskData(TASK_TYPE.STORY_TO_SCRIPT_RUN), {
      attempts: 9,
      priority: 1,
    })

    const call = queueState.calls[queueState.calls.length - 1]
    expect(call?.queueName).toBe('waoowaoo-text')
    expect(call?.name).toBe(TASK_TYPE.STORY_TO_SCRIPT_RUN)
    expect(call?.opts).toMatchObject({
      jobId: 'task-1',
      priority: 1,
      attempts: 1,
    })
  })
})
