'use client'

import { useMemo } from 'react'
import { resolveTaskPresentationState } from '@/lib/task/presentation'

interface UseStoryboardHeaderStateParams {
  runningCount: number
}

export function useStoryboardHeaderState({
  runningCount,
}: UseStoryboardHeaderStateParams) {
  const storyboardTaskRunningState = useMemo(
    () =>
      runningCount > 0
        ? resolveTaskPresentationState({
            phase: 'processing',
            intent: 'generate',
            resource: 'image',
            hasOutput: true,
          })
        : null,
    [runningCount],
  )

  return {
    storyboardTaskRunningState,
  }
}
