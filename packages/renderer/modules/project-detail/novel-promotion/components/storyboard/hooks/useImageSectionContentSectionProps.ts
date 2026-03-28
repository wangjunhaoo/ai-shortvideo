'use client'

import { useMemo, type ComponentProps } from 'react'
import ImageSectionCandidateMode from '../ImageSectionCandidateMode'
import ImageSectionPreviewImage from '../ImageSectionPreviewImage'
import ImageSectionStatusContent from '../ImageSectionStatusContent'
import type {
  ImageSectionContentMode,
  ImageSectionContentProps,
} from '../ImageSectionContent.types'

interface UseImageSectionContentSectionPropsParams
  extends ImageSectionContentProps {
  mode: ImageSectionContentMode
}

export function useImageSectionContentSectionProps({
  mode,
  panelId,
  globalPanelNumber,
  imageUrl,
  failedError,
  candidateData,
  onRegeneratePanelImage,
  onSelectCandidateIndex,
  onConfirmCandidate,
  onCancelCandidate,
  onClearError,
  onPreviewImage,
  triggerPulse,
  labels,
}: UseImageSectionContentSectionPropsParams) {
  const statusBaseProps = useMemo(
    () => ({
      labels: labels.status,
      panelId,
      imageUrl,
      failedError,
      onClearError,
      onRegeneratePanelImage,
      triggerPulse,
    }),
    [
      failedError,
      imageUrl,
      labels.status,
      onClearError,
      onRegeneratePanelImage,
      panelId,
      triggerPulse,
    ],
  )

  const statusContentProps = useMemo(() => {
    switch (mode) {
      case 'deleting':
        return {
          ...statusBaseProps,
          variant: 'loading',
          intent: 'process',
          backdropImageUrl: imageUrl,
        } satisfies ComponentProps<typeof ImageSectionStatusContent>
      case 'modifying':
        return {
          ...statusBaseProps,
          variant: 'loading',
          intent: 'modify',
          backdropImageUrl: imageUrl,
        } satisfies ComponentProps<typeof ImageSectionStatusContent>
      case 'submitting':
        return {
          ...statusBaseProps,
          variant: 'loading',
          intent: 'regenerate',
          backdropImageUrl: imageUrl,
        } satisfies ComponentProps<typeof ImageSectionStatusContent>
      case 'candidate-loading':
        return {
          ...statusBaseProps,
          variant: 'loading',
          intent: imageUrl ? 'regenerate' : 'generate',
          backdropImageUrl: imageUrl,
        } satisfies ComponentProps<typeof ImageSectionStatusContent>
      case 'failed':
        return {
          ...statusBaseProps,
          variant: 'failed',
        } satisfies ComponentProps<typeof ImageSectionStatusContent>
      case 'empty':
        return {
          ...statusBaseProps,
          variant: 'empty',
        } satisfies ComponentProps<typeof ImageSectionStatusContent>
      default:
        return null
    }
  }, [imageUrl, mode, statusBaseProps])

  const candidateModeProps = useMemo(() => {
    if (!candidateData) {
      return null
    }

    return {
      panelId,
      imageUrl,
      candidateData,
      labels: labels.candidate,
      onSelectCandidateIndex,
      onConfirmCandidate,
      onCancelCandidate,
      onPreviewImage,
    } satisfies ComponentProps<typeof ImageSectionCandidateMode>
  }, [
    candidateData,
    imageUrl,
    labels.candidate,
    onCancelCandidate,
    onConfirmCandidate,
    onPreviewImage,
    onSelectCandidateIndex,
    panelId,
  ])

  const previewImageProps = useMemo(() => {
    if (!imageUrl) {
      return null
    }

    return {
      imageUrl,
      shotNumberLabel: labels.formatShotNumberLabel(globalPanelNumber),
      previewTitle: labels.previewTitle,
      onPreviewImage,
    } satisfies ComponentProps<typeof ImageSectionPreviewImage>
  }, [
    globalPanelNumber,
    imageUrl,
    labels,
    onPreviewImage,
  ])

  return {
    statusContentProps,
    candidateModeProps,
    previewImageProps,
  }
}
