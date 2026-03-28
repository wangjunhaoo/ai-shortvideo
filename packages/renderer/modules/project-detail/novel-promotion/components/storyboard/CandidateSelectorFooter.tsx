'use client'

import TaskStatusInline from '@/components/task/TaskStatusInline'
import { AppIcon } from '@/components/ui/icons'
import type { CandidateSelectorFooterProps } from './CandidateSelector.types'

export default function CandidateSelectorFooter({
  confirmPrefixLabel,
  selectedLabel,
  cancelLabel,
  confirmLabel,
  isConfirming,
  confirmingState,
  onCancel,
  onConfirm,
}: CandidateSelectorFooterProps) {
  return (
    <div className="mt-4 flex justify-between items-center">
      <span className="text-sm text-[var(--glass-text-secondary)] font-medium">
        {confirmPrefixLabel}:{' '}
        <span className="text-[var(--glass-tone-info-fg)]">{selectedLabel}</span>
      </span>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={isConfirming}
          className="px-4 py-2 text-sm text-[var(--glass-text-secondary)] bg-[var(--glass-bg-muted)] rounded-lg hover:bg-[var(--glass-bg-muted)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={isConfirming}
          className="px-5 py-2 text-sm bg-[var(--glass-accent-from)] text-white rounded-lg hover:bg-[var(--glass-accent-to)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
        >
          {isConfirming ? (
            <TaskStatusInline
              state={confirmingState}
              className="text-white [&>span]:text-white [&_svg]:text-white"
            />
          ) : (
            <>
              <AppIcon name="check" className="w-4 h-4" />
              {confirmLabel}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
