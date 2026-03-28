'use client'

import type { TaskPresentationState } from '@/lib/task/presentation'

export interface StoryboardHeaderProps {
  totalSegments: number
  totalPanels: number
  isDownloadingImages: boolean
  runningCount: number
  pendingPanelCount: number
  isBatchSubmitting: boolean
  labels: StoryboardHeaderSectionLabels
  onDownloadAllImages: () => void
  onGenerateAllPanels: () => void
  onBack: () => void
}

export interface StoryboardHeaderSectionLabels {
  title: string
  segmentsCountLabel: (count: number) => string
  panelsCountLabel: (count: number) => string
  concurrencyLimitLabel: string
  generateAllPanelsLabel: string
  downloadingLabel: string
  downloadAllLabel: string
  backLabel: string
}

export interface StoryboardHeaderSummaryProps {
  title: string
  segmentsCountLabel: string
  panelsCountLabel: string
  concurrencyLimitLabel: string
  runningCount: number
  storyboardTaskRunningState: TaskPresentationState | null
}

export interface StoryboardHeaderActionsProps {
  pendingPanelCount: number
  totalPanels: number
  runningCount: number
  isBatchSubmitting: boolean
  isDownloadingImages: boolean
  generateAllPanelsLabel: string
  downloadingLabel: string
  downloadAllLabel: string
  backLabel: string
  onGenerateAllPanels: () => void
  onDownloadAllImages: () => void
  onBack: () => void
}
