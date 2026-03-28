'use client'

import { AppIcon } from '@/components/ui/icons'

interface AIDataModalPreviewHeaderProps {
  title: string
  copyLabel: string
  onCopy: () => void
}

export default function AIDataModalPreviewHeader({
  title,
  copyLabel,
  onCopy,
}: AIDataModalPreviewHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs text-[var(--glass-text-tertiary)]">{title}</span>
      <button
        onClick={onCopy}
        className="text-xs text-[var(--glass-tone-info-fg)] hover:text-[var(--glass-text-primary)] flex items-center gap-1"
      >
        <AppIcon name="copy" className="w-3.5 h-3.5" />
        {copyLabel}
      </button>
    </div>
  )
}
