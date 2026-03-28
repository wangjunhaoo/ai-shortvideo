'use client'

import { useMemo } from 'react'
import { resolveTaskPresentationState } from '@/lib/task/presentation'

interface UseStoryboardGroupActionsStateParams {
  hasAnyImage: boolean
  isSubmittingStoryboardTextTask: boolean
  currentRunningCount: number
}

export function useStoryboardGroupActionsState({
  hasAnyImage,
  isSubmittingStoryboardTextTask,
  currentRunningCount,
}: UseStoryboardGroupActionsStateParams) {
  const textTaskRunningState = useMemo(() => {
    if (!isSubmittingStoryboardTextTask) return null
    return resolveTaskPresentationState({
      phase: 'processing',
      intent: 'regenerate',
      resource: 'text',
      hasOutput: true,
    })
  }, [isSubmittingStoryboardTextTask])

  const panelTaskRunningState = useMemo(() => {
    if (currentRunningCount <= 0) return null
    return resolveTaskPresentationState({
      phase: 'processing',
      intent: hasAnyImage ? 'regenerate' : 'generate',
      resource: 'image',
      hasOutput: hasAnyImage,
    })
  }, [currentRunningCount, hasAnyImage])

  return {
    textTaskRunningState,
    panelTaskRunningState,
  }
}
