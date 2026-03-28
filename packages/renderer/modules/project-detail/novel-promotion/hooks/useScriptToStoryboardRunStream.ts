'use client'

import { useRendererRunStreamState, type RunResult } from '@renderer/hooks/useRendererRunStreamState'
import { requestScriptToStoryboardRun } from '@renderer/clients/novel-promotion-runtime-client'
import { TASK_TYPE } from '@/lib/task/types'
import { resolveActiveNovelPromotionRunId } from './run-stream-active-run'

export type ScriptToStoryboardRunParams = {
  episodeId: string
  model?: string
  temperature?: number
  reasoning?: boolean
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high'
}

export type ScriptToStoryboardRunResult = RunResult

type UseScriptToStoryboardRunStreamOptions = {
  projectId: string
  episodeId?: string | null
}

export function useScriptToStoryboardRunStream({
  projectId,
  episodeId,
}: UseScriptToStoryboardRunStreamOptions) {
  return useRendererRunStreamState<ScriptToStoryboardRunParams>({
    projectId,
    storageKeyPrefix: 'novel-promotion:script-to-storyboard-run',
    storageScopeKey: episodeId || undefined,
    executeRequest: (pid, requestBody, signal) =>
      requestScriptToStoryboardRun(pid, requestBody, signal),
    resolveActiveRunId: ({ projectId: pid, storageScopeKey }) =>
      resolveActiveNovelPromotionRunId({
        projectId: pid,
        workflowType: TASK_TYPE.SCRIPT_TO_STORYBOARD_RUN,
        episodeId: storageScopeKey,
      }),
    validateParams: (params) => {
      if (!params.episodeId) {
        throw new Error('episodeId is required')
      }
    },
    buildRequestBody: (params) => ({
      episodeId: params.episodeId,
      model: params.model || undefined,
      temperature: params.temperature,
      reasoning: params.reasoning,
      reasoningEffort: params.reasoningEffort,
      async: true,
      displayMode: 'detail',
    }),
  })
}
