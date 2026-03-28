'use client'

import { useMemo, type ComponentProps } from 'react'
import StoryboardGroupGenerateAllButton from '../StoryboardGroupGenerateAllButton'
import StoryboardGroupManageButtons from '../StoryboardGroupManageButtons'
import StoryboardGroupRegenerateTextButton from '../StoryboardGroupRegenerateTextButton'
import type { StoryboardGroupActionsProps } from '../StoryboardGroupActions.types'

interface UseStoryboardGroupActionSectionPropsParams
  extends StoryboardGroupActionsProps {
  textTaskRunningState: import('@/lib/task/presentation').TaskPresentationState | null
  panelTaskRunningState: import('@/lib/task/presentation').TaskPresentationState | null
}

export function useStoryboardGroupActionSectionProps({
  labels,
  isSubmittingStoryboardTextTask,
  textTaskRunningState,
  pendingCount,
  currentRunningCount,
  panelTaskRunningState,
  onRegenerateText,
  onGenerateAllIndividually,
  isSubmittingStoryboardTask,
  onAddPanel,
  onDeleteStoryboard,
}: UseStoryboardGroupActionSectionPropsParams) {
  const regenerateTextButtonProps = useMemo(
    () =>
      ({
        label: labels.regenerateTextLabel,
        isSubmittingStoryboardTextTask,
        textTaskRunningState,
        onRegenerateText,
      } satisfies ComponentProps<typeof StoryboardGroupRegenerateTextButton>),
    [
      isSubmittingStoryboardTextTask,
      labels.regenerateTextLabel,
      onRegenerateText,
      textTaskRunningState,
    ],
  )

  const generateAllButtonProps = useMemo(
    () =>
      ({
        title: labels.generateMissingImagesTitle,
        label: labels.generateAllLabel,
        pendingCount,
        currentRunningCount,
        panelTaskRunningState,
        onGenerateAllIndividually,
      } satisfies ComponentProps<typeof StoryboardGroupGenerateAllButton>),
    [
      currentRunningCount,
      labels.generateAllLabel,
      labels.generateMissingImagesTitle,
      onGenerateAllIndividually,
      panelTaskRunningState,
      pendingCount,
    ],
  )

  const manageButtonsProps = useMemo(
    () =>
      ({
        addPanelLabel: labels.addPanelLabel,
        deleteLabel: labels.deleteLabel,
        isSubmittingStoryboardTask,
        onAddPanel,
        onDeleteStoryboard,
      } satisfies ComponentProps<typeof StoryboardGroupManageButtons>),
    [
      isSubmittingStoryboardTask,
      labels.addPanelLabel,
      labels.deleteLabel,
      onAddPanel,
      onDeleteStoryboard,
    ],
  )

  return {
    regenerateTextButtonProps,
    generateAllButtonProps,
    manageButtonsProps,
  }
}
