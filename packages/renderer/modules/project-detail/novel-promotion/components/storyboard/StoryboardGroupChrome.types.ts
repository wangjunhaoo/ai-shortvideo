'use client'

import type { TaskPresentationState } from '@/lib/task/presentation'
import type { StoryboardGroupProps } from './StoryboardGroup.types'
import type { StoryboardGroupChromeMainRowLabels } from './StoryboardGroupChromeMainRow.types'

export interface StoryboardGroupChromeStatusLabels {
  failedTitle: string
  closeTitle: string
}

export interface StoryboardGroupChromeLabels {
  status: StoryboardGroupChromeStatusLabels
  mainRow: StoryboardGroupChromeMainRowLabels
}

export interface StoryboardGroupChromeProps {
  labels: StoryboardGroupChromeLabels
  failedError: StoryboardGroupProps['failedError']
  isSubmittingStoryboardTask: StoryboardGroupProps['isSubmittingStoryboardTask']
  isSelectingCandidate: StoryboardGroupProps['isSelectingCandidate']
  groupOverlayState: TaskPresentationState | null
  clip: StoryboardGroupProps['clip']
  sbIndex: StoryboardGroupProps['sbIndex']
  totalStoryboards: StoryboardGroupProps['totalStoryboards']
  movingClipId: StoryboardGroupProps['movingClipId']
  storyboardClipId: StoryboardGroupProps['storyboard']['clipId']
  formatClipTitle: StoryboardGroupProps['formatClipTitle']
  onMoveUp: StoryboardGroupProps['onMoveUp']
  onMoveDown: StoryboardGroupProps['onMoveDown']
  hasAnyImage: StoryboardGroupProps['hasAnyImage']
  isSubmittingStoryboardTextTask: StoryboardGroupProps['isSubmittingStoryboardTextTask']
  currentRunningCount: number
  pendingCount: number
  onRegenerateText: StoryboardGroupProps['onRegenerateText']
  onGenerateAllIndividually: StoryboardGroupProps['onGenerateAllIndividually']
  onAddPanel: StoryboardGroupProps['onAddPanel']
  onDeleteStoryboard: StoryboardGroupProps['onDeleteStoryboard']
  onCloseError: StoryboardGroupProps['onCloseError']
}
