'use client'
import { MediaImageWithLoading } from '@/components/media/MediaImageWithLoading'
import ImageSectionCandidateActions from './ImageSectionCandidateActions'
import ImageSectionCandidateStatusBadge from './ImageSectionCandidateStatusBadge'
import ImageSectionCandidateThumbnails from './ImageSectionCandidateThumbnails'
import type { ImageSectionCandidateModeProps } from './ImageSectionCandidateMode.types'
import { useImageSectionCandidateModeSectionProps } from './hooks/useImageSectionCandidateModeSectionProps'
import { useImageSectionCandidateModeState } from './hooks/useImageSectionCandidateModeState'

export default function ImageSectionCandidateMode({
  panelId,
  imageUrl,
  candidateData,
  labels,
  onSelectCandidateIndex,
  onConfirmCandidate,
  onCancelCandidate,
  onPreviewImage,
}: ImageSectionCandidateModeProps) {
  const {
    isConfirming,
    validCandidates,
    safeSelectedIndex,
    confirmingState,
    handleConfirm,
  } = useImageSectionCandidateModeState({
    panelId,
    imageUrl,
    candidateData,
    onConfirmCandidate,
  })
  const {
    previewTitle,
    selectedCandidateLabel,
    thumbnailsProps,
    actionsProps,
    statusBadgeProps,
  } = useImageSectionCandidateModeSectionProps({
    panelId,
    imageUrl,
    candidateData,
    labels,
    onSelectCandidateIndex,
    onConfirmCandidate,
    onCancelCandidate,
    onPreviewImage,
    validCandidates,
    safeSelectedIndex,
    isConfirming,
    confirmingState,
    onConfirm: handleConfirm,
  })

  if (validCandidates.length === 0) {
    return null
  }

  return (
    <div className="w-full h-full relative">
      <MediaImageWithLoading
        src={validCandidates[safeSelectedIndex]}
        alt={selectedCandidateLabel}
        containerClassName="h-full w-full"
        className="w-full h-full object-cover cursor-pointer"
        onClick={() => onPreviewImage?.(validCandidates[safeSelectedIndex])}
        title={previewTitle}
        sizes="(max-width: 768px) 100vw, 33vw"
      />

      <div className="absolute bottom-2 left-2 right-2 glass-surface-soft border border-[var(--glass-stroke-base)] p-2 rounded-xl">
        <div className="flex items-center justify-between">
          <ImageSectionCandidateThumbnails {...thumbnailsProps} />
          <ImageSectionCandidateActions {...actionsProps} />
        </div>
      </div>

      <ImageSectionCandidateStatusBadge {...statusBadgeProps} />
    </div>
  )
}
