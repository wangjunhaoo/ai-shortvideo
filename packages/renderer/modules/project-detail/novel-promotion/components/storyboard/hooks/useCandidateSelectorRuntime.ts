'use client'

import type {
  CandidateSelectorFooterProps,
  CandidateSelectorProps,
  CandidateSelectorThumbnailItem,
} from '../CandidateSelector.types'
import { useCandidateSelectorSectionProps } from './useCandidateSelectorSectionProps'
import { useCandidateSelectorState } from './useCandidateSelectorState'

export function useCandidateSelectorRuntime({
  originalImageUrl,
  candidates,
  selectedIndex,
  videoRatio,
  onSelect,
  onConfirm,
  onCancel,
  onPreview,
  getImageUrl,
  labels,
}: CandidateSelectorProps) {

  const {
    isConfirming,
    confirmingState,
    thumbWidth,
    thumbHeight,
    selectedLabel,
    handleConfirm,
  } = useCandidateSelectorState({
    videoRatio,
    selectedIndex,
    originalLabel: labels.originalLabel,
    getCandidateLabel: labels.candidateLabel,
    onConfirm,
  })

  const thumbnailItems: CandidateSelectorThumbnailItem[] = [
    {
      key: 'original',
      label: labels.originalLabel,
      alt: labels.originalLabel,
      imageUrl: originalImageUrl ? getImageUrl(originalImageUrl) : null,
      isSelected: selectedIndex === 0,
      width: thumbWidth,
      height: thumbHeight,
      onClick: () => {
        onSelect(0)
        if (originalImageUrl) {
          onPreview(getImageUrl(originalImageUrl)!)
        }
      },
    },
    ...candidates.map((url, index) => {
      const label = labels.candidateLabel(index + 1)
      return {
        key: `${index}-${url}`,
        label,
        alt: label,
        imageUrl: getImageUrl(url),
        isSelected: selectedIndex === index + 1,
        width: thumbWidth,
        height: thumbHeight,
        onClick: () => {
          onSelect(index + 1)
          onPreview(getImageUrl(url)!)
        },
      }
    }),
  ]

  const sections = useCandidateSelectorSectionProps({
    isConfirming,
    onCancel,
    thumbnailItems,
    fallbackText: labels.fallbackText,
    footerProps: {
      confirmPrefixLabel: labels.confirmPrefixLabel,
      selectedLabel,
      cancelLabel: labels.cancelLabel,
      confirmLabel: labels.confirmLabel,
      isConfirming,
      confirmingState,
      onCancel,
      onConfirm: handleConfirm,
    } satisfies CandidateSelectorFooterProps,
    title: labels.title,
    subtitle: labels.subtitle,
  })

  return {
    sections,
  }
}
