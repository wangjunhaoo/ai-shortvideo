'use client'
import ImageSectionPrimaryActions from './ImageSectionPrimaryActions'
import type { ImageSectionActionButtonsProps } from './ImageSectionActionButtons.types'
import ImageSectionUndoAction from './ImageSectionUndoAction'
import { useImageSectionActionButtonsProps } from './hooks/useImageSectionActionButtonsProps'
import { useImageSectionActionButtonsState } from './hooks/useImageSectionActionButtonsState'

export default function ImageSectionActionButtons({
  labels,
  panelId,
  imageUrl,
  previousImageUrl,
  isSubmittingPanelImageTask,
  isModifying,
  onRegeneratePanelImage,
  onOpenEditModal,
  onOpenAIDataModal,
  onUndo,
  triggerPulse,
}: ImageSectionActionButtonsProps) {
  const { count, setCount, handleRegenerate } =
    useImageSectionActionButtonsState({
      panelId,
      isSubmittingPanelImageTask,
      onRegeneratePanelImage,
      triggerPulse,
    })
  const { containerClassName, primaryActionsProps, undoActionProps } =
    useImageSectionActionButtonsProps({
      labels,
      panelId,
      imageUrl,
      previousImageUrl,
      isSubmittingPanelImageTask,
      isModifying,
      onRegeneratePanelImage,
      onOpenEditModal,
      onOpenAIDataModal,
      onUndo,
      triggerPulse,
      count,
      onCountChange: setCount,
      onRegenerate: handleRegenerate,
    })

  return (
    <div className={containerClassName}>
      <div className="relative glass-surface-modal border border-[var(--glass-stroke-base)] rounded-lg p-0.5">
        <div className="flex items-center gap-0.5">
          <ImageSectionPrimaryActions {...primaryActionsProps} />
          <ImageSectionUndoAction {...undoActionProps} />
        </div>
      </div>
    </div>
  )
}
