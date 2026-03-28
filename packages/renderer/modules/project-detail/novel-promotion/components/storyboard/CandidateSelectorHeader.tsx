'use client'

import { AppIcon } from '@/components/ui/icons'
import type { CandidateSelectorHeaderProps } from './CandidateSelector.types'

export default function CandidateSelectorHeader({
  title,
  subtitle,
  isConfirming,
  onCancel,
}: CandidateSelectorHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h4 className="font-bold text-[var(--glass-text-primary)] text-sm">{title}</h4>
        <p className="text-xs text-[var(--glass-text-tertiary)]">{subtitle}</p>
      </div>
      <button
        onClick={onCancel}
        disabled={isConfirming}
        className="text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <AppIcon name="close" className="w-5 h-5" />
      </button>
    </div>
  )
}
