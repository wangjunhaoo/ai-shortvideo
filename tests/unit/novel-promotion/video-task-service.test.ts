import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  submitTaskMock,
  hasPanelVideoOutputMock,
  resolveProjectModelCapabilityGenerationOptionsMock,
  findManyMock,
  findFirstMock,
} = vi.hoisted(() => ({
  submitTaskMock: vi.fn(),
  hasPanelVideoOutputMock: vi.fn(),
  resolveProjectModelCapabilityGenerationOptionsMock: vi.fn(),
  findManyMock: vi.fn(),
  findFirstMock: vi.fn(),
}))

vi.mock('@/lib/task/submitter', () => ({
  submitTask: submitTaskMock,
}))

vi.mock('@/lib/task/has-output', () => ({
  hasPanelVideoOutput: hasPanelVideoOutputMock,
}))

vi.mock('@engine/config-service', () => ({
  resolveProjectModelCapabilityGenerationOptions: resolveProjectModelCapabilityGenerationOptionsMock,
}))

vi.mock('@engine/prisma', () => ({
  prisma: {
    novelPromotionPanel: {
      findMany: findManyMock,
      findFirst: findFirstMock,
    },
  },
}))

import { submitNovelPromotionGenerateVideoTask } from '@engine/services/novel-promotion-video-task-service'

describe('novel promotion video task service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    submitTaskMock.mockResolvedValue({ taskId: 'task-1' })
    hasPanelVideoOutputMock.mockResolvedValue(false)
    resolveProjectModelCapabilityGenerationOptionsMock.mockResolvedValue({
      resolution: '1080p',
      duration: 8,
    })
    findManyMock.mockResolvedValue([{ id: 'panel-1' }])
    findFirstMock.mockResolvedValue({ id: 'panel-1' })
  })

  it('uses normalized video generation options for batch task payloads', async () => {
    const result = await submitNovelPromotionGenerateVideoTask({
      projectId: 'project-1',
      userId: 'user-1',
      locale: 'zh',
      body: {
        all: true,
        episodeId: 'episode-1',
        videoModel: 'google::veo-3.0-fast-generate-001',
        generationOptions: {
          resolution: '1080p',
        },
      },
    })

    expect(resolveProjectModelCapabilityGenerationOptionsMock).toHaveBeenCalledWith({
      projectId: 'project-1',
      userId: 'user-1',
      modelType: 'video',
      modelKey: 'google::veo-3.0-fast-generate-001',
      runtimeSelections: {
        generationMode: 'normal',
        resolution: '1080p',
      },
    })
    expect(submitTaskMock).toHaveBeenCalledTimes(1)
    expect(submitTaskMock.mock.calls[0]?.[0]?.payload?.generationOptions).toEqual({
      resolution: '1080p',
      duration: 8,
    })
    expect(result).toEqual({
      tasks: [{ taskId: 'task-1' }],
      total: 1,
    })
  })
})
