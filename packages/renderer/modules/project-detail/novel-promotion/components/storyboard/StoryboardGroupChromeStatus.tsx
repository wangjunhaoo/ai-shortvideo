'use client'

import TaskStatusOverlay from '@/components/task/TaskStatusOverlay'
import StoryboardGroupFailedAlert from './StoryboardGroupFailedAlert'
import type {
  StoryboardGroupChromeProps,
  StoryboardGroupChromeStatusLabels,
} from './StoryboardGroupChrome.types'

interface StoryboardGroupChromeStatusProps {
  labels: StoryboardGroupChromeStatusLabels
  failedError: StoryboardGroupChromeProps['failedError']
  isSubmittingStoryboardTask: StoryboardGroupChromeProps['isSubmittingStoryboardTask']
  isSelectingCandidate: StoryboardGroupChromeProps['isSelectingCandidate']
  groupOverlayState: StoryboardGroupChromeProps['groupOverlayState']
  onCloseError: StoryboardGroupChromeProps['onCloseError']
}

export default function StoryboardGroupChromeStatus({
  labels,
  failedError,
  isSubmittingStoryboardTask,
  isSelectingCandidate,
  groupOverlayState,
  onCloseError,
}: StoryboardGroupChromeStatusProps) {
  return (
    <>
      {failedError ? (
        <StoryboardGroupFailedAlert
          failedError={failedError}
          title={labels.failedTitle}
          closeTitle={labels.closeTitle}
          onClose={onCloseError}
        />
      ) : null}

      {isSubmittingStoryboardTask || isSelectingCandidate ? (
        <TaskStatusOverlay
          state={groupOverlayState}
          className="z-10 rounded-lg bg-[var(--glass-bg-surface-modal)]/90"
        />
      ) : null}
    </>
  )
}
