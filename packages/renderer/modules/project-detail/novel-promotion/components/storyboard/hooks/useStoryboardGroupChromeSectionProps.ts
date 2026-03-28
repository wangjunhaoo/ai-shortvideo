'use client'

import { useMemo, type ComponentProps } from 'react'
import StoryboardGroupChromeMainRow from '../StoryboardGroupChromeMainRow'
import StoryboardGroupChromeStatus from '../StoryboardGroupChromeStatus'
import type { StoryboardGroupChromeProps } from '../StoryboardGroupChrome.types'

export function useStoryboardGroupChromeSectionProps(
  props: StoryboardGroupChromeProps,
) {
  const statusProps = useMemo(
    () =>
      ({
        labels: props.labels.status,
        failedError: props.failedError,
        isSubmittingStoryboardTask: props.isSubmittingStoryboardTask,
        isSelectingCandidate: props.isSelectingCandidate,
        groupOverlayState: props.groupOverlayState,
        onCloseError: props.onCloseError,
      } satisfies ComponentProps<typeof StoryboardGroupChromeStatus>),
    [
      props.failedError,
      props.groupOverlayState,
      props.isSelectingCandidate,
      props.isSubmittingStoryboardTask,
      props.labels.status,
      props.onCloseError,
    ],
  )

  const mainRowProps = ({
    labels: props.labels.mainRow,
    clip: props.clip,
    sbIndex: props.sbIndex,
    totalStoryboards: props.totalStoryboards,
    movingClipId: props.movingClipId,
    storyboardClipId: props.storyboardClipId,
    formatClipTitle: props.formatClipTitle,
    onMoveUp: props.onMoveUp,
    onMoveDown: props.onMoveDown,
    hasAnyImage: props.hasAnyImage,
    isSubmittingStoryboardTask: props.isSubmittingStoryboardTask,
    isSubmittingStoryboardTextTask: props.isSubmittingStoryboardTextTask,
    currentRunningCount: props.currentRunningCount,
    pendingCount: props.pendingCount,
    onRegenerateText: props.onRegenerateText,
    onGenerateAllIndividually: props.onGenerateAllIndividually,
    onAddPanel: props.onAddPanel,
    onDeleteStoryboard: props.onDeleteStoryboard,
  }) satisfies ComponentProps<typeof StoryboardGroupChromeMainRow>

  return {
    statusProps,
    mainRowProps,
  }
}
