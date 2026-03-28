'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { resolveTaskErrorMessage } from '@/lib/task/error-message'
import { clearTaskTargetOverlay, upsertTaskTargetOverlay } from '@/lib/query/task-target-overlay'
import { queryKeys } from '@/lib/query/keys'
import type { Project } from '@/types/project'
import { dismissTasks, listTasks } from '@renderer/clients/task-client'
import {
  requestAiModifyProjectShotPrompt,
  requestAnalyzeProjectAssets,
  requestAnalyzeProjectVoice,
  requestBatchGenerateVideos,
  requestCreateProjectVoiceLine,
  requestDesignProjectVoice,
  requestDeleteProjectVoiceLine,
  requestDownloadProjectVoices,
  requestDownloadRemoteBlob,
  requestFetchProjectVoiceStageData,
  requestGenerateVideo,
  requestGetProjectStoryboardStats,
  requestGenerateProjectVoice,
  requestListProjectEpisodeVideoUrls,
  requestListProjectEpisodes,
  requestLipSync,
  requestMatchedVoiceLines,
  requestSaveProjectEpisodesBatch,
  requestSplitProjectEpisodes,
  requestSplitProjectEpisodesByMarkers,
  requestUpdateProjectClip,
  requestUpdateProjectConfig,
  requestUpdateProjectPanelActingNotes,
  requestUpdateProjectPanelLink,
  requestUpdateProjectPanelVideoPrompt,
  requestUpdateProjectPhotographyPlan,
  requestUpdateProjectEpisodeField,
  requestUpdateProjectVoiceLine,
  requestUpdateSpeakerVoice,
  type RendererMatchedVoiceLinesData,
  type RendererProjectEpisodesBatchPayload,
} from '@renderer/clients/novel-promotion-runtime-client'
import type { SpeakerVoicePatch } from '@/lib/voice/provider-voice-binding'
import type {
  BatchVideoGenerationParams,
  VideoGenerationOptions,
} from '@renderer/modules/project-detail/novel-promotion/components/video'

type EpisodeSnapshot = Record<string, unknown>
export type MatchedVoiceLinesData = RendererMatchedVoiceLinesData

export type TaskItem = {
  id: string
  type: string
  targetType: string
  targetId: string
  episodeId?: string | null
  status: string
  progress?: number | null
  errorCode?: string | null
  errorMessage?: string | null
  error?: {
    code: string
    message: string
    retryable: boolean
    category: string
    userMessageKey: string
    details?: Record<string, unknown> | null
  } | null
  createdAt: string
  updatedAt: string
}

const SNAPSHOT_STATUS = ['queued', 'processing', 'completed', 'failed'] as const

function buildTaskSearch(params: {
  projectId: string
  targetType?: string
  targetId?: string
  type?: string[]
  statuses: readonly string[]
  limit?: number
}) {
  const search = new URLSearchParams()
  search.set('projectId', params.projectId)
  if (params.targetType) search.set('targetType', params.targetType)
  if (params.targetId) search.set('targetId', params.targetId)
  for (const status of params.statuses) {
    search.append('status', status)
  }
  if (typeof params.limit === 'number') {
    search.set('limit', String(params.limit))
  }
  for (const taskType of params.type || []) {
    search.append('type', taskType)
  }
  return search
}

export function useGetProjectStoryboardStats(projectId: string) {
  return useMutation({
    mutationFn: ({ episodeId }: { episodeId: string }) =>
      requestGetProjectStoryboardStats(projectId, episodeId),
  })
}

export function useUpdateProjectConfig(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      requestUpdateProjectConfig(projectId, key, value),
    onMutate: async ({ key, value }) => {
      const projectQueryKey = queryKeys.projectData(projectId)
      await queryClient.cancelQueries({ queryKey: projectQueryKey })
      const previousProject = queryClient.getQueryData<Project>(projectQueryKey)

      queryClient.setQueryData<Project | undefined>(projectQueryKey, (prev) => {
        if (!prev?.novelPromotionData) return prev
        return {
          ...prev,
          novelPromotionData: {
            ...prev.novelPromotionData,
            [key]: value,
          },
        }
      })

      return { previousProject }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(queryKeys.projectData(projectId), context.previousProject)
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) })
    },
  })
}

export function useUpdateProjectEpisodeField(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      episodeId,
      key,
      value,
    }: {
      episodeId: string
      key: string
      value: unknown
    }) => requestUpdateProjectEpisodeField(projectId, episodeId, key, value),
    onMutate: async (variables) => {
      const episodeQueryKey = queryKeys.episodeData(projectId, variables.episodeId)
      const projectQueryKey = queryKeys.projectData(projectId)

      await queryClient.cancelQueries({ queryKey: episodeQueryKey })
      await queryClient.cancelQueries({ queryKey: projectQueryKey })

      const previousEpisode = queryClient.getQueryData<EpisodeSnapshot>(episodeQueryKey)
      const previousProject = queryClient.getQueryData<Project>(projectQueryKey)

      queryClient.setQueryData<EpisodeSnapshot | undefined>(episodeQueryKey, (prev) => {
        if (!prev) return prev
        return {
          ...prev,
          [variables.key]: variables.value,
        }
      })

      queryClient.setQueryData<Project | undefined>(projectQueryKey, (prev) => {
        if (!prev?.novelPromotionData) return prev
        const episodes = Array.isArray(prev.novelPromotionData.episodes)
          ? prev.novelPromotionData.episodes.map((episode) =>
              episode.id === variables.episodeId
                ? { ...episode, [variables.key]: variables.value }
                : episode,
            )
          : prev.novelPromotionData.episodes
        return {
          ...prev,
          novelPromotionData: {
            ...prev.novelPromotionData,
            episodes,
          },
        }
      })

      return {
        previousEpisode,
        previousProject,
        episodeId: variables.episodeId,
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousEpisode && context.episodeId) {
        queryClient.setQueryData(
          queryKeys.episodeData(projectId, context.episodeId),
          context.previousEpisode,
        )
      }
      if (context?.previousProject) {
        queryClient.setQueryData(queryKeys.projectData(projectId), context.previousProject)
      }
    },
    onSettled: async (_data, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.episodeData(projectId, variables.episodeId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) }),
      ])
    },
  })
}

export function useListProjectEpisodes(projectId: string) {
  return useMutation({
    mutationFn: () => requestListProjectEpisodes(projectId),
  })
}

export function useSaveProjectEpisodesBatch(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: RendererProjectEpisodesBatchPayload) =>
      requestSaveProjectEpisodesBatch(projectId, payload),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) })
    },
  })
}

export function useSplitProjectEpisodes(projectId: string) {
  return useMutation({
    mutationFn: (payload: { content: string; async?: boolean }) =>
      requestSplitProjectEpisodes(projectId, payload),
  })
}

export function useSplitProjectEpisodesByMarkers(projectId: string) {
  return useMutation({
    mutationFn: (payload: { content: string }) =>
      requestSplitProjectEpisodesByMarkers(projectId, payload),
  })
}

export function useAnalyzeProjectAssets(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ episodeId }: { episodeId: string }) =>
      requestAnalyzeProjectAssets(projectId, episodeId),
    onSettled: async (_data, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.episodeData(projectId, variables.episodeId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectAssets.all(projectId),
        }),
      ])
    },
  })
}

export function useAiModifyProjectShotPrompt(projectId: string) {
  return useMutation({
    mutationFn: (payload: {
      currentPrompt: string
      currentVideoPrompt?: string
      modifyInstruction: string
      referencedAssets: Array<{
        id: string
        name: string
        description: string
        type: 'character' | 'location'
      }>
    }) => requestAiModifyProjectShotPrompt(projectId, payload),
  })
}

export function useFetchProjectVoiceStageData(projectId: string) {
  return useMutation({
    mutationFn: ({ episodeId }: { episodeId: string }) =>
      requestFetchProjectVoiceStageData(projectId, episodeId),
  })
}

export function useAnalyzeProjectVoice(projectId: string) {
  return useMutation({
    mutationFn: ({ episodeId }: { episodeId: string }) =>
      requestAnalyzeProjectVoice(projectId, episodeId),
  })
}

export function useDesignProjectVoice(projectId: string) {
  return useMutation({
    mutationFn: (payload: {
      voicePrompt: string
      previewText: string
      preferredName: string
      language: 'zh'
    }) => requestDesignProjectVoice(projectId, payload),
  })
}

export function useMatchedVoiceLines(projectId: string | null, episodeId: string | null) {
  return useQuery({
    queryKey: queryKeys.voiceLines.matched(projectId || '', episodeId || ''),
    queryFn: async () => {
      if (!projectId || !episodeId) {
        throw new Error('Project ID and Episode ID are required')
      }
      return requestMatchedVoiceLines(projectId, episodeId)
    },
    enabled: !!projectId && !!episodeId,
  })
}

export function useTaskList(params: {
  projectId?: string | null
  targetType?: string | null
  targetId?: string | null
  type?: string[]
  statuses?: string[]
  limit?: number
  enabled?: boolean
}) {
  const enabled = (params.enabled ?? true) && !!params.projectId
  const statusKey = (params.statuses || []).slice().sort().join(',')
  const typeKey = (params.type || []).slice().sort().join(',')
  const queryKey = [
    ...queryKeys.tasks.all(params.projectId || ''),
    params.targetType || '',
    params.targetId || '',
    statusKey,
    typeKey,
    params.limit ?? '',
  ] as const

  return useQuery({
    queryKey,
    enabled,
    staleTime: 5000,
    queryFn: async () => {
      const search = buildTaskSearch({
        projectId: params.projectId!,
        targetType: params.targetType || undefined,
        targetId: params.targetId || undefined,
        type: params.type,
        statuses: params.statuses || SNAPSHOT_STATUS,
        limit: params.limit,
      })
      const response = await listTasks(search)
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(resolveTaskErrorMessage(payload, 'Failed to fetch tasks'))
      }
      const data = await response.json()
      return (data.tasks || []) as TaskItem[]
    },
  })
}

export function useGenerateProjectVoice(projectId: string) {
  return useMutation({
    mutationFn: ({
      episodeId,
      lineId,
      all,
    }: {
      episodeId: string
      lineId?: string
      all?: boolean
    }) => requestGenerateProjectVoice(projectId, { episodeId, lineId, all }),
  })
}

export function useCreateProjectVoiceLine(projectId: string) {
  return useMutation({
    mutationFn: (payload: {
      episodeId: string
      content: string
      speaker: string
      matchedPanelId?: string | null
    }) => requestCreateProjectVoiceLine(projectId, payload),
  })
}

export function useUpdateProjectVoiceLine(projectId: string) {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      requestUpdateProjectVoiceLine(projectId, payload),
  })
}

export function useDeleteProjectVoiceLine(projectId: string) {
  return useMutation({
    mutationFn: ({ lineId }: { lineId: string }) =>
      requestDeleteProjectVoiceLine(projectId, lineId),
  })
}

export function useDownloadProjectVoices(projectId: string) {
  return useMutation({
    mutationFn: ({ episodeId }: { episodeId: string }) =>
      requestDownloadProjectVoices(projectId, episodeId),
  })
}

export function useUpdateSpeakerVoice(projectId: string) {
  return useMutation({
    mutationFn: (payload: {
      episodeId: string
      speaker: string
    } & SpeakerVoicePatch) => requestUpdateSpeakerVoice(projectId, payload),
  })
}

export function useListProjectEpisodeVideoUrls(projectId: string) {
  return useMutation({
    mutationFn: (payload: {
      episodeId: string
      panelPreferences: Record<string, boolean>
    }) => requestListProjectEpisodeVideoUrls(projectId, payload),
  })
}

export function useDownloadRemoteBlob() {
  return useMutation({
    mutationFn: (url: string) => requestDownloadRemoteBlob(url),
  })
}

export function useDismissFailedTasks(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskIds: string[]) => {
      const response = await dismissTasks(taskIds)
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(resolveTaskErrorMessage(data, '关闭错误失败'))
      }
      return data as { success: boolean; dismissed: number }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(projectId), exact: false })
    },
  })
}

export function useUpdateProjectClip(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      clipId,
      data,
    }: {
      clipId: string
      data: Record<string, unknown>
      episodeId?: string
    }) => requestUpdateProjectClip(projectId, clipId, data),
    onMutate: async (variables) => {
      if (!variables.episodeId) {
        return { previousEpisode: null, episodeId: null }
      }

      const episodeQueryKey = queryKeys.episodeData(projectId, variables.episodeId)
      await queryClient.cancelQueries({ queryKey: episodeQueryKey })

      const previousEpisode = queryClient.getQueryData<EpisodeSnapshot>(episodeQueryKey)
      queryClient.setQueryData<EpisodeSnapshot | undefined>(episodeQueryKey, (prev) => {
        if (!prev) return prev
        const clips = Array.isArray(prev.clips) ? prev.clips : []
        return {
          ...prev,
          clips: clips.map((clip: Record<string, unknown>) =>
            clip?.id === variables.clipId ? { ...clip, ...variables.data } : clip,
          ),
        }
      })

      return { previousEpisode, episodeId: variables.episodeId }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousEpisode && context.episodeId) {
        queryClient.setQueryData(
          queryKeys.episodeData(projectId, context.episodeId),
          context.previousEpisode,
        )
      }
    },
    onSettled: async (_data, _error, variables) => {
      const invalidations = [
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) }),
      ]
      if (variables.episodeId) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.episodeData(projectId, variables.episodeId),
          }),
        )
      }
      await Promise.all(invalidations)
    },
  })
}

export function useUpdateProjectPanelLink(projectId: string) {
  return useMutation({
    mutationFn: (payload: {
      storyboardId: string
      panelIndex: number
      linked: boolean
    }) => requestUpdateProjectPanelLink(projectId, payload),
  })
}

export function useUpdateProjectPanelVideoPrompt(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: {
      storyboardId: string
      panelIndex: number
      value: string
      field?: 'videoPrompt' | 'firstLastFramePrompt'
    }) => requestUpdateProjectPanelVideoPrompt(projectId, payload),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) })
    },
  })
}

export function useUpdateProjectPhotographyPlan(projectId: string) {
  return useMutation({
    mutationFn: (payload: {
      storyboardId: string
      photographyPlan: string
    }) => requestUpdateProjectPhotographyPlan(projectId, payload),
  })
}

export function useUpdateProjectPanelActingNotes(projectId: string) {
  return useMutation({
    mutationFn: (payload: {
      storyboardId: string
      panelIndex: number
      actingNotes: string
    }) => requestUpdateProjectPanelActingNotes(projectId, payload),
  })
}

export function useGenerateVideo(projectId: string | null, episodeId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      storyboardId: string
      panelIndex: number
      panelId?: string
      videoModel: string
      generationOptions?: VideoGenerationOptions
      firstLastFrame?: {
        lastFrameStoryboardId: string
        lastFramePanelIndex: number
        flModel: string
        customPrompt?: string
      }
    }) => {
      if (!projectId) {
        throw new Error('Project ID is required')
      }
      return requestGenerateVideo(projectId, {
        storyboardId: params.storyboardId,
        panelIndex: params.panelIndex,
        videoModel: params.videoModel,
        generationOptions: params.generationOptions,
        firstLastFrame: params.firstLastFrame,
      })
    },
    onMutate: async ({ panelId }) => {
      if (!projectId) return
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(projectId), exact: false })
      if (!panelId) return
      upsertTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'NovelPromotionPanel',
        targetId: panelId,
        intent: 'generate',
      })
    },
    onError: (_error, { panelId }) => {
      if (!projectId || !panelId) return
      clearTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'NovelPromotionPanel',
        targetId: panelId,
      })
    },
    onSettled: async () => {
      if (episodeId && projectId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.episodeData(projectId, episodeId),
        })
      }
    },
  })
}

export function useBatchGenerateVideos(projectId: string | null, episodeId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: BatchVideoGenerationParams) => {
      if (!projectId) throw new Error('Project ID is required')
      if (!episodeId) throw new Error('Episode ID is required')
      const requestBody: {
        all: boolean
        episodeId: string
        videoModel: string
        generationOptions?: VideoGenerationOptions
      } = {
        all: true,
        episodeId,
        videoModel: params.videoModel,
      }
      if (params.generationOptions && typeof params.generationOptions === 'object') {
        requestBody.generationOptions = params.generationOptions
      }
      return requestBatchGenerateVideos(projectId, requestBody)
    },
    onMutate: async () => {
      if (!projectId) return
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(projectId), exact: false })
    },
    onSettled: async () => {
      if (episodeId && projectId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.episodeData(projectId, episodeId),
        })
      }
    },
  })
}

export function useLipSync(projectId: string | null, episodeId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      storyboardId: string
      panelIndex: number
      voiceLineId: string
      panelId?: string
    }) => {
      if (!projectId) throw new Error('Project ID is required')
      return requestLipSync(projectId, {
        storyboardId: params.storyboardId,
        panelIndex: params.panelIndex,
        voiceLineId: params.voiceLineId,
      })
    },
    onMutate: async ({ panelId }) => {
      if (!projectId) return
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(projectId), exact: false })
      if (!panelId) return
      upsertTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'NovelPromotionPanel',
        targetId: panelId,
        intent: 'generate',
      })
    },
    onError: (_error, { panelId }) => {
      if (!projectId || !panelId) return
      clearTaskTargetOverlay(queryClient, {
        projectId,
        targetType: 'NovelPromotionPanel',
        targetId: panelId,
      })
    },
    onSettled: async () => {
      if (projectId && episodeId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.episodeData(projectId, episodeId),
        })
      }
    },
  })
}
