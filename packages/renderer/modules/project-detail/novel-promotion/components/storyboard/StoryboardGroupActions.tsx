'use client'

import StoryboardGroupGenerateAllButton from './StoryboardGroupGenerateAllButton'
import StoryboardGroupManageButtons from './StoryboardGroupManageButtons'
import StoryboardGroupRegenerateTextButton from './StoryboardGroupRegenerateTextButton'
import { useStoryboardGroupActionSectionProps } from './hooks/useStoryboardGroupActionSectionProps'
import { useStoryboardGroupActionsState } from './hooks/useStoryboardGroupActionsState'
import type { StoryboardGroupActionsProps } from './StoryboardGroupActions.types'

export default function StoryboardGroupActions({
  labels,
  hasAnyImage,
  isSubmittingStoryboardTask,
  isSubmittingStoryboardTextTask,
  currentRunningCount,
  pendingCount,
  onRegenerateText,
  onGenerateAllIndividually,
  onAddPanel,
  onDeleteStoryboard,
}: StoryboardGroupActionsProps) {
  const { textTaskRunningState, panelTaskRunningState } =
    useStoryboardGroupActionsState({
      hasAnyImage,
      isSubmittingStoryboardTextTask,
      currentRunningCount,
    })
  const {
    regenerateTextButtonProps,
    generateAllButtonProps,
    manageButtonsProps,
  } = useStoryboardGroupActionSectionProps({
    labels,
    hasAnyImage,
    isSubmittingStoryboardTask,
    isSubmittingStoryboardTextTask,
    currentRunningCount,
    pendingCount,
    onRegenerateText,
    onGenerateAllIndividually,
    onAddPanel,
    onDeleteStoryboard,
    textTaskRunningState,
    panelTaskRunningState,
  })

  return (
    <div className="flex items-center gap-2">
      <StoryboardGroupRegenerateTextButton {...regenerateTextButtonProps} />
      <StoryboardGroupGenerateAllButton {...generateAllButtonProps} />
      <StoryboardGroupManageButtons {...manageButtonsProps} />
    </div>
  )
}

