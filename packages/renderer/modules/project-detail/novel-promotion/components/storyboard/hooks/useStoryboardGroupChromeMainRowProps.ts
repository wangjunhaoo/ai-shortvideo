'use client'

import type { ComponentProps } from 'react'
import StoryboardGroupActions from '../StoryboardGroupActions'
import StoryboardGroupHeader from '../StoryboardGroupHeader'
import type {
  StoryboardGroupChromeMainRowProps,
} from '../StoryboardGroupChromeMainRow.types'

export function useStoryboardGroupChromeMainRowProps({
  labels,
  clip,
  sbIndex,
  totalStoryboards,
  movingClipId,
  storyboardClipId,
  formatClipTitle,
  onMoveUp,
  onMoveDown,
  hasAnyImage,
  isSubmittingStoryboardTask,
  isSubmittingStoryboardTextTask,
  currentRunningCount,
  pendingCount,
  onRegenerateText,
  onGenerateAllIndividually,
  onAddPanel,
  onDeleteStoryboard,
}: StoryboardGroupChromeMainRowProps) {
  const headerProps: ComponentProps<typeof StoryboardGroupHeader> = {
    labels: labels.header,
    clip,
    sbIndex,
    totalStoryboards,
    movingClipId,
    storyboardClipId,
    formatClipTitle,
    onMoveUp,
    onMoveDown,
  }

  const actionsProps: ComponentProps<typeof StoryboardGroupActions> = {
    labels: labels.actions,
    hasAnyImage,
    isSubmittingStoryboardTask,
    isSubmittingStoryboardTextTask,
    currentRunningCount,
    pendingCount,
    onRegenerateText,
    onGenerateAllIndividually,
    onAddPanel,
    onDeleteStoryboard,
  }

  return {
    headerProps,
    actionsProps,
  }
}
