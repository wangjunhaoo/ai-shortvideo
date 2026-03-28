'use client'

import { MediaImageWithLoading } from '@/components/media/MediaImageWithLoading'
import type {
  PanelInfo,
  PanelVariantModalPanelInfoLabels,
} from './PanelVariantModal.types'

interface PanelVariantModalPanelInfoProps {
  labels: PanelVariantModalPanelInfoLabels
  panel: PanelInfo
}

export default function PanelVariantModalPanelInfo({
  labels,
  panel,
}: PanelVariantModalPanelInfoProps) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-32 flex-shrink-0">
        {panel.imageUrl ? (
          <MediaImageWithLoading
            src={panel.imageUrl}
            alt={labels.imageAlt}
            containerClassName="w-full aspect-[9/16] rounded-lg shadow-[var(--glass-shadow-sm)]"
            className="w-full aspect-[9/16] object-cover rounded-lg shadow-[var(--glass-shadow-sm)]"
            width={256}
            height={456}
            sizes="128px"
          />
        ) : (
          <div className="w-full aspect-[9/16] bg-[var(--glass-bg-muted)] rounded-lg flex items-center justify-center text-[var(--glass-text-tertiary)] text-xs">
            {labels.noImageLabel}
          </div>
        )}
        <div className="text-xs text-[var(--glass-text-tertiary)] mt-1 text-center">#{panel.panelNumber}</div>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-1">{labels.originalDescriptionLabel}</h3>
        <p className="text-sm text-[var(--glass-text-secondary)]">{panel.description || labels.noDescriptionLabel}</p>
      </div>
    </div>
  )
}
