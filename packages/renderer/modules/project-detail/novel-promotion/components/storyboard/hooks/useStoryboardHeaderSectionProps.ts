'use client'

import { useMemo, type ComponentProps } from 'react'
import StoryboardHeaderActions from '../StoryboardHeaderActions'
import StoryboardHeaderSummary from '../StoryboardHeaderSummary'
import type {
  StoryboardHeaderProps,
  StoryboardHeaderSectionLabels,
} from '../StoryboardHeader.types'

interface UseStoryboardHeaderSectionPropsParams extends StoryboardHeaderProps {
  storyboardTaskRunningState: import('@/lib/task/presentation').TaskPresentationState | null
  labels: StoryboardHeaderSectionLabels
}

export function useStoryboardHeaderSectionProps({
  totalSegments,
  totalPanels,
  isDownloadingImages,
  runningCount,
  pendingPanelCount,
  isBatchSubmitting,
  onDownloadAllImages,
  onGenerateAllPanels,
  onBack,
  storyboardTaskRunningState,
  labels,
}: UseStoryboardHeaderSectionPropsParams) {
  const summaryProps = useMemo(
    () =>
      ({
        title: labels.title,
        segmentsCountLabel: labels.segmentsCountLabel(totalSegments),
        panelsCountLabel: labels.panelsCountLabel(totalPanels),
        concurrencyLimitLabel: labels.concurrencyLimitLabel,
        runningCount,
        storyboardTaskRunningState,
      } satisfies ComponentProps<typeof StoryboardHeaderSummary>),
    [labels, runningCount, storyboardTaskRunningState, totalPanels, totalSegments],
  )

  const actionsProps = useMemo(
    () =>
      ({
        pendingPanelCount,
        totalPanels,
        runningCount,
        isBatchSubmitting,
        isDownloadingImages,
        generateAllPanelsLabel: labels.generateAllPanelsLabel,
        downloadingLabel: labels.downloadingLabel,
        downloadAllLabel: labels.downloadAllLabel,
        backLabel: labels.backLabel,
        onGenerateAllPanels,
        onDownloadAllImages,
        onBack,
      } satisfies ComponentProps<typeof StoryboardHeaderActions>),
    [
      isBatchSubmitting,
      isDownloadingImages,
      labels,
      onBack,
      onDownloadAllImages,
      onGenerateAllPanels,
      pendingPanelCount,
      runningCount,
      totalPanels,
    ],
  )

  return {
    summaryProps,
    actionsProps,
  }
}
