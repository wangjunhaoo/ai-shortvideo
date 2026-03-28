'use client'

import { useRendererRunStreamState, type RunResult } from '@renderer/hooks/useRendererRunStreamState'
import { requestStoryToScriptRun } from '@renderer/clients/novel-promotion-runtime-client'
import { TASK_TYPE } from '@/lib/task/types'
import { resolveActiveNovelPromotionRunId } from './run-stream-active-run'

export type StoryToScriptRunParams = {
  episodeId: string
  content: string
  model?: string
  temperature?: number
  reasoning?: boolean
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high'
}

export type StoryToScriptRunResult = RunResult

type UseStoryToScriptRunStreamOptions = {
  projectId: string
  episodeId?: string | null
}

export function useStoryToScriptRunStream({ projectId, episodeId }: UseStoryToScriptRunStreamOptions) {
  return useRendererRunStreamState<StoryToScriptRunParams>({
    projectId,
    storageKeyPrefix: 'novel-promotion:story-to-script-run',
    storageScopeKey: episodeId || undefined,
    executeRequest: (pid, requestBody, signal) =>
      requestStoryToScriptRun(pid, requestBody, signal),
    resolveActiveRunId: ({ projectId: pid, storageScopeKey }) =>
      resolveActiveNovelPromotionRunId({
        projectId: pid,
        workflowType: TASK_TYPE.STORY_TO_SCRIPT_RUN,
        episodeId: storageScopeKey,
      }),
    validateParams: (params) => {
      if (!params.episodeId) {
        throw new Error('episodeId is required')
      }
      if (!params.content.trim()) {
        throw new Error('content is required')
      }
    },
    buildRequestBody: (params) => ({
      episodeId: params.episodeId,
      content: params.content,
      model: params.model || undefined,
      temperature: params.temperature,
      reasoning: params.reasoning,
      reasoningEffort: params.reasoningEffort,
      async: true,
      displayMode: 'detail',
    }),
  })
}
