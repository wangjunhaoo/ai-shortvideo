'use client'

import { MediaImageWithLoading } from '@/components/media/MediaImageWithLoading'
import type {
  InsertPanelModalPreviewLabels,
  PanelInfo,
} from './InsertPanelModal.types'

interface InsertPanelModalPanelsPreviewProps {
  labels: InsertPanelModalPreviewLabels
  prevPanel: PanelInfo
  nextPanel: PanelInfo | null
}

function PreviewCard({
  label,
  imageUrl,
  fallback,
}: {
  label: string
  imageUrl: string | null
  fallback: string
}) {
  return (
    <div className="flex-1 bg-[var(--glass-bg-muted)] rounded-lg p-2 text-center">
      {imageUrl ? (
        <MediaImageWithLoading
          src={imageUrl}
          alt={label}
          containerClassName="w-full aspect-[9/16] rounded-md"
          className="w-full aspect-[9/16] object-cover rounded-md"
        />
      ) : (
        <div className="w-full aspect-[9/16] bg-[var(--glass-bg-muted)] rounded-md flex items-center justify-center text-[var(--glass-text-tertiary)] text-xs">
          {fallback}
        </div>
      )}
      <div className="text-xs text-[var(--glass-text-tertiary)] mt-1">
        {label}
      </div>
    </div>
  )
}

export default function InsertPanelModalPanelsPreview({
  labels,
  prevPanel,
  nextPanel,
}: InsertPanelModalPanelsPreviewProps) {
  return (
    <div className="flex gap-3 items-center">
      <PreviewCard
        label={`#${prevPanel.panelNumber}`}
        imageUrl={prevPanel.imageUrl}
        fallback={labels.noImageFallback}
      />

      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] flex items-center justify-center text-xl font-bold">
          +
        </div>
      </div>

      {nextPanel ? (
        <PreviewCard
          label={`#${nextPanel.panelNumber}`}
          imageUrl={nextPanel.imageUrl}
          fallback={labels.noImageFallback}
        />
      ) : (
        <PreviewCard
          label={labels.insertLabel}
          imageUrl={null}
          fallback={labels.insertAtEndFallback}
        />
      )}
    </div>
  )
}
