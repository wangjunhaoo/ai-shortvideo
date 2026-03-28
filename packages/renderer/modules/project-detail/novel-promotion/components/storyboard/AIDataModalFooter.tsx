'use client'

import { AppIcon } from '@/components/ui/icons'

interface AIDataModalFooterProps {
  cancelLabel: string
  saveLabel: string
  onClose: () => void
  onSave: () => void
}

export default function AIDataModalFooter({
  cancelLabel,
  saveLabel,
  onClose,
  onSave,
}: AIDataModalFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--glass-stroke-base)] bg-[var(--glass-bg-muted)]">
      <button
        onClick={onClose}
        className="px-4 py-2 text-sm text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-bg-muted)] rounded-lg transition-colors"
      >
        {cancelLabel}
      </button>
      <button
        onClick={onSave}
        className="px-4 py-2 text-sm text-white bg-[var(--glass-accent-from)] hover:bg-[var(--glass-accent-to)] rounded-lg transition-colors flex items-center gap-2"
      >
        <AppIcon name="check" className="w-4 h-4" />
        {saveLabel}
      </button>
    </div>
  )
}
