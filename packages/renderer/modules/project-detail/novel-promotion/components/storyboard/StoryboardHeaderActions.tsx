'use client'

import { GlassButton } from '@/components/ui/primitives'
import type { StoryboardHeaderActionsProps } from './StoryboardHeader.types'

export default function StoryboardHeaderActions({
  pendingPanelCount,
  totalPanels,
  runningCount,
  isBatchSubmitting,
  isDownloadingImages,
  generateAllPanelsLabel,
  downloadingLabel,
  downloadAllLabel,
  backLabel,
  onGenerateAllPanels,
  onDownloadAllImages,
  onBack,
}: StoryboardHeaderActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {pendingPanelCount > 0 ? (
        <GlassButton
          variant="primary"
          loading={isBatchSubmitting}
          onClick={onGenerateAllPanels}
          disabled={runningCount > 0}
        >
          {generateAllPanelsLabel} ({pendingPanelCount})
        </GlassButton>
      ) : null}

      <GlassButton
        variant="secondary"
        loading={isDownloadingImages}
        onClick={onDownloadAllImages}
        disabled={totalPanels === 0}
      >
        {isDownloadingImages ? downloadingLabel : downloadAllLabel}
      </GlassButton>

      <GlassButton variant="ghost" onClick={onBack}>
        {backLabel}
      </GlassButton>
    </div>
  )
}
