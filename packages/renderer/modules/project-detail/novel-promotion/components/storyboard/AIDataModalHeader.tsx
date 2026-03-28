'use client'

import { AppIcon } from '@/components/ui/icons'

interface AIDataModalHeaderProps {
  title: string
  subtitle: string
  onClose: () => void
}

export default function AIDataModalHeader({
  title,
  subtitle,
  onClose,
}: AIDataModalHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-stroke-base)] bg-[var(--glass-bg-muted)]">
      <div className="flex items-center gap-3">
        <span className="text-2xl" />
        <div>
          <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">{title}</h2>
          <p className="text-xs text-[var(--glass-text-tertiary)]">
            {subtitle}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-[var(--glass-bg-muted)] rounded-lg transition-colors"
      >
        <AppIcon name="close" className="w-5 h-5 text-[var(--glass-text-tertiary)]" />
      </button>
    </div>
  )
}
