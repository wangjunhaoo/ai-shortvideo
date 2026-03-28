'use client'

import { useMemo, type ComponentProps } from 'react'
import ImageSectionPrimaryActions from '../ImageSectionPrimaryActions'
import ImageSectionUndoAction from '../ImageSectionUndoAction'
import type { ImageSectionActionButtonsProps } from '../ImageSectionActionButtons.types'

interface UseImageSectionActionButtonsPropsParams
  extends ImageSectionActionButtonsProps {
  count: number
  onCountChange: (count: number) => void
  onRegenerate: () => void
}

export function useImageSectionActionButtonsProps({
  labels,
  panelId,
  imageUrl,
  previousImageUrl,
  isSubmittingPanelImageTask,
  isModifying,
  onOpenEditModal,
  onOpenAIDataModal,
  onUndo,
  count,
  onCountChange,
  onRegenerate,
}: UseImageSectionActionButtonsPropsParams) {
  const containerClassName = useMemo(
    () =>
      `absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 transition-opacity ${
        isSubmittingPanelImageTask ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`,
    [isSubmittingPanelImageTask],
  )

  const primaryActionsProps = useMemo(
    () =>
      ({
        labels,
        imageUrl,
        isSubmittingPanelImageTask,
        isModifying,
        count,
        onCountChange,
        onRegenerate,
        onOpenAIDataModal,
        onOpenEditModal,
      } satisfies ComponentProps<typeof ImageSectionPrimaryActions>),
    [
      count,
      imageUrl,
      isModifying,
      isSubmittingPanelImageTask,
      labels,
      onCountChange,
      onOpenAIDataModal,
      onOpenEditModal,
      onRegenerate,
    ],
  )

  const undoActionProps = useMemo(
    () =>
      ({
        undoLabel: labels.undoLabel,
        panelId,
        previousImageUrl,
        onUndo,
        isSubmittingPanelImageTask,
      } satisfies ComponentProps<typeof ImageSectionUndoAction>),
    [isSubmittingPanelImageTask, labels.undoLabel, onUndo, panelId, previousImageUrl],
  )

  return {
    containerClassName,
    primaryActionsProps,
    undoActionProps,
  }
}
