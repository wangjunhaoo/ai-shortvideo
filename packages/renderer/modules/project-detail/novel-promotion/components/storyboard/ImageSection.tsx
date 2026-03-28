'use client'
import './ImageSection.css'
import ImageSectionActionButtons from './ImageSectionActionButtons'
import ImageSectionBadges from './ImageSectionBadges'
import ImageSectionContent from './ImageSectionContent'
import type { ImageSectionProps } from './ImageSection.types'
import { useImageSectionViewProps } from './hooks/useImageSectionViewProps'
import { useImageSectionState } from './hooks/useImageSectionState'

export default function ImageSection({
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
  labels,
}: ImageSectionProps) {
  const {
    isTaskPulseAnimating,
    cssAspectRatio,
    hasValidCandidates,
    triggerPulse,
  } = useImageSectionState({
    videoRatio,
    candidateData,
  })
  const {
    containerClassName,
    containerStyle,
    contentProps,
    badgesProps,
    actionButtonsProps,
    showActionButtons,
  } = useImageSectionViewProps({
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
  })

  return (
    <div className={containerClassName} style={containerStyle}>
      <ImageSectionContent {...contentProps} />

      <ImageSectionBadges {...badgesProps} />

      {showActionButtons && <ImageSectionActionButtons {...actionButtonsProps} />}
    </div>
  )
}
