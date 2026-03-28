'use client'

import { useCallback, useMemo } from 'react'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import type { StoryboardPanel } from './useStoryboardState'

interface UseStoryboardGroupViewStateParams {
  textPanels: StoryboardPanel[]
  submittingPanelImageIds: Set<string>
  panelTaskErrorMap: Map<string, { taskId: string; message: string }>
  isSubmittingStoryboardTask: boolean
  isSelectingCandidate: boolean
  hasAnyImage: boolean
  onRegeneratePanelImage: (panelId: string, count?: number, force?: boolean) => void
  clearPanelTaskError: (panelId: string) => void
}

export function useStoryboardGroupViewState({
  textPanels,
  submittingPanelImageIds,
  panelTaskErrorMap,
  isSubmittingStoryboardTask,
  isSelectingCandidate,
  hasAnyImage,
  onRegeneratePanelImage,
  clearPanelTaskError,
}: UseStoryboardGroupViewStateParams) {
  const isPanelTaskRunning = useCallback(
    (panel: StoryboardPanel) => {
      const taskIntent = (panel as StoryboardPanel & { imageTaskIntent?: string }).imageTaskIntent
      if (taskIntent === 'modify') return false

      const isTaskRunning = Boolean((panel as StoryboardPanel & { imageTaskRunning?: boolean }).imageTaskRunning)
      const isSubmitting = submittingPanelImageIds.has(panel.id)
      if (isTaskRunning || isSubmitting) return true

      const taskError = panelTaskErrorMap.get(panel.id)
      if (taskError) return false

      return false
    },
    [panelTaskErrorMap, submittingPanelImageIds],
  )

  const currentRunningCount = useMemo(
    () => textPanels.filter(isPanelTaskRunning).length,
    [isPanelTaskRunning, textPanels],
  )

  const pendingCount = useMemo(
    () => textPanels.filter((panel) => !panel.imageUrl && !isPanelTaskRunning(panel)).length,
    [isPanelTaskRunning, textPanels],
  )

  const groupOverlayState = useMemo(() => {
    if (!isSubmittingStoryboardTask && !isSelectingCandidate) return null
    return resolveTaskPresentationState({
      phase: 'processing',
      intent: isSelectingCandidate ? 'process' : hasAnyImage ? 'regenerate' : 'generate',
      resource: 'image',
      hasOutput: hasAnyImage,
    })
  }, [hasAnyImage, isSelectingCandidate, isSubmittingStoryboardTask])

  const handleRegeneratePanelImage = useCallback(
    (panelId: string, count?: number, force?: boolean) => {
      clearPanelTaskError(panelId)
      onRegeneratePanelImage(panelId, count, force)
    },
    [clearPanelTaskError, onRegeneratePanelImage],
  )

  return {
    isPanelTaskRunning,
    currentRunningCount,
    pendingCount,
    groupOverlayState,
    handleRegeneratePanelImage,
  }
}
