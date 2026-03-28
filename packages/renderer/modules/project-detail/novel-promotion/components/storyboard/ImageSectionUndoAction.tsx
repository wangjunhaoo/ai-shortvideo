'use client'

import type { ImageSectionActionLabels } from './ImageSectionActionButtons.types'

interface ImageSectionUndoActionProps {
  undoLabel: ImageSectionActionLabels['undoLabel']
  panelId: string
  previousImageUrl?: string | null
  onUndo?: (panelId: string) => void
  isSubmittingPanelImageTask: boolean
}

export default function ImageSectionUndoAction({
  undoLabel,
  panelId,
  previousImageUrl,
  onUndo,
  isSubmittingPanelImageTask,
}: ImageSectionUndoActionProps) {
  if (!previousImageUrl || !onUndo) {
    return null
  }

  return (
    <>
      <div className="w-px h-3 bg-[var(--glass-stroke-base)]" />
      <button
        onClick={() => onUndo(panelId)}
        disabled={isSubmittingPanelImageTask}
        className="glass-btn-base glass-btn-secondary flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] transition-all active:scale-95 disabled:opacity-50"
        title={undoLabel}
      >
        <span>{undoLabel}</span>
      </button>
    </>
  )
}
