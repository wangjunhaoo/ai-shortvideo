'use client'

import type { StoryboardGroupChromeProps } from './StoryboardGroupChrome.types'
import type { StoryboardGroupActionLabels } from './StoryboardGroupActions.types'
import type { StoryboardGroupHeaderLabels } from './StoryboardGroupHeader'

export interface StoryboardGroupChromeMainRowLabels {
  header: StoryboardGroupHeaderLabels
  actions: StoryboardGroupActionLabels
}

export interface StoryboardGroupChromeMainRowProps {
  labels: StoryboardGroupChromeMainRowLabels
  clip: StoryboardGroupChromeProps['clip']
  sbIndex: StoryboardGroupChromeProps['sbIndex']
  totalStoryboards: StoryboardGroupChromeProps['totalStoryboards']
  movingClipId: StoryboardGroupChromeProps['movingClipId']
  storyboardClipId: StoryboardGroupChromeProps['storyboardClipId']
  formatClipTitle: StoryboardGroupChromeProps['formatClipTitle']
  onMoveUp: StoryboardGroupChromeProps['onMoveUp']
  onMoveDown: StoryboardGroupChromeProps['onMoveDown']
  hasAnyImage: StoryboardGroupChromeProps['hasAnyImage']
  isSubmittingStoryboardTask: StoryboardGroupChromeProps['isSubmittingStoryboardTask']
  isSubmittingStoryboardTextTask: StoryboardGroupChromeProps['isSubmittingStoryboardTextTask']
  currentRunningCount: StoryboardGroupChromeProps['currentRunningCount']
  pendingCount: StoryboardGroupChromeProps['pendingCount']
  onRegenerateText: StoryboardGroupChromeProps['onRegenerateText']
  onGenerateAllIndividually: StoryboardGroupChromeProps['onGenerateAllIndividually']
  onAddPanel: StoryboardGroupChromeProps['onAddPanel']
  onDeleteStoryboard: StoryboardGroupChromeProps['onDeleteStoryboard']
}
