'use client'

import TaskStatusInline from '@/components/task/TaskStatusInline'
import type { ImageSectionCandidateActionsProps } from './ImageSectionCandidateMode.types'

export default function ImageSectionCandidateActions({
  cancelLabel,
  confirmLabel,
  panelId,
  isConfirming,
  confirmingState,
  onCancelCandidate,
  onConfirm,
}: ImageSectionCandidateActionsProps) {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => onCancelCandidate(panelId)}
        disabled={isConfirming}
        className="glass-btn-base glass-btn-secondary px-2 py-1 text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cancelLabel}
      </button>
      <button
        onClick={() => {
          void onConfirm()
        }}
        disabled={isConfirming}
        className="glass-btn-base glass-btn-primary flex items-center gap-1 rounded px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConfirming ? (
          <TaskStatusInline
            state={confirmingState}
            className="text-white [&>span]:text-white [&_svg]:text-white"
          />
        ) : (
          confirmLabel
        )}
      </button>
    </div>
  )
}
