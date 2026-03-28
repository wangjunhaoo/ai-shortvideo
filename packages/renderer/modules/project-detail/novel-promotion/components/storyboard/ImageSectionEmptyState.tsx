'use client'

import { GlassButton } from '@/components/ui/primitives'
import { AppIcon } from '@/components/ui/icons'

interface ImageSectionEmptyStateProps {
  emptyLabel: string
  generateLabel: string
  onGenerate: () => void
}

export default function ImageSectionEmptyState({
  emptyLabel,
  generateLabel,
  onGenerate,
}: ImageSectionEmptyStateProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--glass-bg-surface-strong)] text-[var(--glass-text-tertiary)]">
      <AppIcon name="imagePreview" className="w-8 h-8" />
      <span className="text-xs">{emptyLabel}</span>
      <GlassButton variant="primary" size="sm" onClick={onGenerate}>
        {generateLabel}
      </GlassButton>
    </div>
  )
}
