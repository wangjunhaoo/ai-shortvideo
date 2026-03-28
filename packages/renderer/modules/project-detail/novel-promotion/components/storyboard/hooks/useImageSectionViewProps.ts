'use client'

import type { CSSProperties } from 'react'
import type { ImageSectionActionButtonsProps } from '../ImageSectionActionButtons.types'
import type { ImageSectionContentProps } from '../ImageSectionContent.types'
import type { ImageSectionProps } from '../ImageSection.types'

export function useImageSectionViewProps({
  panelId,
  imageUrl,
  globalPanelNumber,
  shotType,
  videoRatio,
  isDeleting,
  isModifying,
  isSubmittingPanelImageTask,
  failedError,
  candidateData,
  previousImageUrl,
  onRegeneratePanelImage,
  onOpenEditModal,
  onOpenAIDataModal,
  onSelectCandidateIndex,
  onConfirmCandidate,
  onCancelCandidate,
  onClearError,
  onUndo,
  onPreviewImage,
  isTaskPulseAnimating,
  cssAspectRatio,
  hasValidCandidates,
  triggerPulse,
  labels,
}: ImageSectionProps & {
  isTaskPulseAnimating: boolean
  cssAspectRatio: string
  hasValidCandidates: boolean
  triggerPulse: () => void
}) {
  const containerClassName = `relative overflow-hidden group rounded-t-2xl transition-all bg-[var(--glass-bg-muted)] ${
    isTaskPulseAnimating ? 'animate-brightness-boost' : ''
  }`
  const containerStyle: CSSProperties = { aspectRatio: cssAspectRatio }

  const contentProps: ImageSectionContentProps = {
    panelId,
    imageUrl,
    globalPanelNumber,
    isDeleting,
    isModifying,
    isSubmittingPanelImageTask,
    failedError,
    candidateData,
    onRegeneratePanelImage,
    onSelectCandidateIndex,
    onConfirmCandidate,
    onCancelCandidate,
    onClearError,
    onPreviewImage,
    hasValidCandidates,
    triggerPulse,
    labels: labels.content,
  }

  const actionButtonsProps: ImageSectionActionButtonsProps = {
    labels: labels.actions,
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
  }

  return {
    containerClassName,
    containerStyle,
    contentProps,
    badgesProps: {
      globalPanelNumber,
      shotType,
    },
    actionButtonsProps,
    showActionButtons: !candidateData,
  }
}
