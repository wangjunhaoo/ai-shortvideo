'use client'

import ImageSectionCandidateMode from './ImageSectionCandidateMode'
import ImageSectionPreviewImage from './ImageSectionPreviewImage'
import ImageSectionStatusContent from './ImageSectionStatusContent'
import type { ImageSectionContentProps } from './ImageSectionContent.types'
import { useImageSectionContentMode } from './hooks/useImageSectionContentMode'
import { useImageSectionContentSectionProps } from './hooks/useImageSectionContentSectionProps'

export default function ImageSectionContent({
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
  labels,
}: ImageSectionContentProps) {
  const mode = useImageSectionContentMode({
    imageUrl,
    isDeleting,
    isModifying,
    isSubmittingPanelImageTask,
    failedError,
    candidateData,
    hasValidCandidates,
  })
  const {
    statusContentProps,
    candidateModeProps,
    previewImageProps,
  } = useImageSectionContentSectionProps({
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
    labels,
    mode,
  })

  if (mode === 'submitting') {
    return statusContentProps ? <ImageSectionStatusContent {...statusContentProps} /> : null
  }

  if (mode === 'candidate') {
    return candidateModeProps ? <ImageSectionCandidateMode {...candidateModeProps} /> : null
  }

  if (mode !== 'image') {
    return statusContentProps ? <ImageSectionStatusContent {...statusContentProps} /> : null
  }

  return previewImageProps ? <ImageSectionPreviewImage {...previewImageProps} /> : null
}
