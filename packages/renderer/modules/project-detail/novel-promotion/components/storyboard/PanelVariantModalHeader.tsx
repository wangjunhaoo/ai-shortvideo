'use client'

import { AppIcon } from '@/components/ui/icons'
import type { PanelVariantModalHeaderProps } from './PanelVariantModal.types'

export default function PanelVariantModalHeader({
  labels,
  isDisabled,
  onClose,
}: PanelVariantModalHeaderProps) {
  return (
    <div className="px-5 py-3 border-b border-[var(--glass-stroke-base)] flex items-center justify-between">
      <h2 className="text-base font-bold text-[var(--glass-text-primary)] flex items-center gap-2">
        <AppIcon name="videoWide" className="h-4 w-4 text-[var(--glass-text-secondary)]" />
        {labels.title}
      </h2>
      <button
        onClick={onClose}
        disabled={isDisabled}
        className="glass-btn-base glass-btn-soft p-1.5 disabled:opacity-50"
      >
        <AppIcon name="close" className="w-5 h-5" />
      </button>
    </div>
  )
}
