'use client'

import type { TaskPresentationState } from '@/lib/task/presentation'

export interface StoryboardGroupActionsProps {
  labels: StoryboardGroupActionLabels
  hasAnyImage: boolean
  isSubmittingStoryboardTask: boolean
  isSubmittingStoryboardTextTask: boolean
  currentRunningCount: number
  pendingCount: number
  onRegenerateText: () => void
  onGenerateAllIndividually: () => void
  onAddPanel: () => void
  onDeleteStoryboard: () => void
}

export interface StoryboardGroupActionLabels {
  regenerateTextLabel: string
  generateMissingImagesTitle: string
  generateAllLabel: string
  addPanelLabel: string
  deleteLabel: string
}

export interface StoryboardGroupRegenerateTextButtonProps {
  label: string
  isSubmittingStoryboardTextTask: boolean
  textTaskRunningState: TaskPresentationState | null
  onRegenerateText: () => void
}

export interface StoryboardGroupGenerateAllButtonProps {
  title: string
  label: string
  pendingCount: number
  currentRunningCount: number
  panelTaskRunningState: TaskPresentationState | null
  onGenerateAllIndividually: () => void
}

export interface StoryboardGroupManageButtonsProps {
  addPanelLabel: string
  deleteLabel: string
  isSubmittingStoryboardTask: boolean
  onAddPanel: () => void
  onDeleteStoryboard: () => void
}
