'use client'

import ImageSectionEmptyState from './ImageSectionEmptyState'
import ImageSectionFailedState from './ImageSectionFailedState'
import ImageSectionLoadingState from './ImageSectionLoadingState'
import type { ImageSectionStatusContentProps } from './ImageSectionStatusContent.types'

export default function ImageSectionStatusContent({
  variant,
  labels,
  panelId,
  failedError,
  intent,
  backdropImageUrl,
  onClearError,
  onRegeneratePanelImage,
  triggerPulse,
}: ImageSectionStatusContentProps) {
  if (variant === 'loading') {
    return (
      <ImageSectionLoadingState
        alt={labels.loadingAlt}
        intent={intent ?? 'generate'}
        backdropImageUrl={backdropImageUrl ?? null}
      />
    )
  }

  if (variant === 'failed') {
    return (
      <ImageSectionFailedState
        failedLabel={labels.failedLabel}
        closeLabel={labels.closeLabel}
        failedError={failedError}
        onClearError={onClearError}
      />
    )
  }

  return (
    <ImageSectionEmptyState
      emptyLabel={labels.emptyLabel}
      generateLabel={labels.generateLabel}
      onGenerate={() => {
        triggerPulse()
        onRegeneratePanelImage(panelId, 1, false)
      }}
    />
  )
}
