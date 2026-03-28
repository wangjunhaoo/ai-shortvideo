'use client'

import type { TaskPresentationState } from '@/lib/task/presentation'
import type { StoryboardHeaderSectionLabels } from './StoryboardHeader.types'

export interface StoryboardToolbarLabels {
  addGroupAtStartLabel: string
  header: StoryboardHeaderSectionLabels
}

export interface StoryboardToolbarProps {
  totalSegments: number
  totalPanels: number
  isDownloadingImages: boolean
  runningCount: number
  pendingPanelCount: number
  isBatchSubmitting: boolean
  addingStoryboardGroup: boolean
  addingStoryboardGroupState: TaskPresentationState | null
  labels: StoryboardToolbarLabels
  onDownloadAllImages: () => Promise<void>
  onGenerateAllPanels: () => Promise<void>
  onAddStoryboardGroupAtStart: () => void
  onBack: () => void
}

export interface StoryboardAddGroupButtonProps {
  label: string
  addingStoryboardGroup: boolean
  addingStoryboardGroupState: TaskPresentationState | null
  onAddStoryboardGroupAtStart: () => void
}
