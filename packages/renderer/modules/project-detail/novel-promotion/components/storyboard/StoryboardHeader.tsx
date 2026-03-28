'use client'

import { GlassSurface } from '@/components/ui/primitives'
import StoryboardHeaderActions from './StoryboardHeaderActions'
import StoryboardHeaderSummary from './StoryboardHeaderSummary'
import { useStoryboardHeaderSectionProps } from './hooks/useStoryboardHeaderSectionProps'
import { useStoryboardHeaderState } from './hooks/useStoryboardHeaderState'
import type { StoryboardHeaderProps } from './StoryboardHeader.types'

export default function StoryboardHeader({
  totalSegments,
  totalPanels,
  isDownloadingImages,
  runningCount,
  pendingPanelCount,
  isBatchSubmitting,
  labels,
  onDownloadAllImages,
  onGenerateAllPanels,
  onBack
}: StoryboardHeaderProps) {
  const { storyboardTaskRunningState } = useStoryboardHeaderState({
    runningCount,
  })
  const { summaryProps, actionsProps } = useStoryboardHeaderSectionProps({
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
  })

  return (
    <GlassSurface variant="elevated" className="space-y-4 p-4">
      <StoryboardHeaderSummary {...summaryProps} />
      <StoryboardHeaderActions {...actionsProps} />
    </GlassSurface>
  )
}
