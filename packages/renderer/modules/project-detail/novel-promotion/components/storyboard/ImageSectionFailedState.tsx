'use client'

import { AppIcon } from '@/components/ui/icons'

interface ImageSectionFailedStateProps {
  failedLabel: string
  closeLabel: string
  failedError: string | null
  onClearError: () => void
}

export default function ImageSectionFailedState({
  failedLabel,
  closeLabel,
  failedError,
  onClearError,
}: ImageSectionFailedStateProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[var(--glass-danger-ring)] text-[var(--glass-tone-danger-fg)] p-2">
      <AppIcon name="alert" className="w-6 h-6 mb-1" />
      <span className="text-xs text-center font-medium">{failedLabel}</span>
      <span className="text-[10px] text-center mt-1 line-clamp-2 px-1">
        {failedError}
      </span>
      <button
        onClick={onClearError}
        className="glass-btn-base glass-btn-tone-danger mt-1 px-2 py-1 text-[10px] rounded-md"
      >
        {closeLabel}
      </button>
    </div>
  )
}
