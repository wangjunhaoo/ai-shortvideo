'use client'

import StoryboardGroupActions from './StoryboardGroupActions'
import StoryboardGroupHeader from './StoryboardGroupHeader'
import type { StoryboardGroupChromeMainRowProps } from './StoryboardGroupChromeMainRow.types'
import { useStoryboardGroupChromeMainRowProps } from './hooks/useStoryboardGroupChromeMainRowProps'

export default function StoryboardGroupChromeMainRow({
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
  const { headerProps, actionsProps } = useStoryboardGroupChromeMainRowProps({
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
  })

  return (
    <div className="mb-4 pb-2 flex items-start justify-between">
      <StoryboardGroupHeader {...headerProps} />
      <StoryboardGroupActions {...actionsProps} />
    </div>
  )
}
