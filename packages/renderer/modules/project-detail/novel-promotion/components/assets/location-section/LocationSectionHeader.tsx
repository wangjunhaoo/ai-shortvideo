'use client'

import { AppIcon } from '@/components/ui/icons'

interface LocationSectionHeaderLabels {
  sectionTitle: string
  sectionCountLabel: (count: number) => string
  addLocationLabel: string
}

interface LocationSectionHeaderProps {
  count: number
  onAddLocation: () => void
  labels: LocationSectionHeaderLabels
}

export function LocationSectionHeader({
  count,
  onAddLocation,
  labels,
}: LocationSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)]">
          <AppIcon name="imageLandscape" className="h-5 w-5" />
        </span>
        <h3 className="text-lg font-bold text-[var(--glass-text-primary)]">
          {labels.sectionTitle}
        </h3>
        <span className="text-sm text-[var(--glass-text-tertiary)] bg-[var(--glass-bg-muted)]/50 px-2 py-1 rounded-lg">
          {labels.sectionCountLabel(count)}
        </span>
      </div>
      <button
        onClick={onAddLocation}
        className="glass-btn-base glass-btn-primary flex items-center gap-2 px-4 py-2 font-medium"
      >
        + {labels.addLocationLabel}
      </button>
    </div>
  )
}
