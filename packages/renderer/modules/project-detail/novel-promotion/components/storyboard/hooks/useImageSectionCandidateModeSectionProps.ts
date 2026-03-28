'use client'

import { useMemo, type ComponentProps } from 'react'
import ImageSectionCandidateActions from '../ImageSectionCandidateActions'
import ImageSectionCandidateStatusBadge from '../ImageSectionCandidateStatusBadge'
import ImageSectionCandidateThumbnails from '../ImageSectionCandidateThumbnails'
import type { ImageSectionCandidateModeProps } from '../ImageSectionCandidateMode.types'

interface UseImageSectionCandidateModeSectionPropsParams
  extends ImageSectionCandidateModeProps {
  validCandidates: string[]
  safeSelectedIndex: number
  isConfirming: boolean
  confirmingState: import('@/lib/task/presentation').TaskPresentationState | null
  onConfirm: () => Promise<void>
}

export function useImageSectionCandidateModeSectionProps({
  panelId,
  candidateData,
  labels,
  onSelectCandidateIndex,
  onCancelCandidate,
  onPreviewImage,
  validCandidates,
  safeSelectedIndex,
  isConfirming,
  confirmingState,
  onConfirm,
}: UseImageSectionCandidateModeSectionPropsParams) {
  const selectedCandidateLabel = useMemo(
    () => labels.formatCandidateCountLabel(safeSelectedIndex + 1),
    [labels, safeSelectedIndex],
  )

  const thumbnailsProps = useMemo(
    () =>
      ({
        items: validCandidates.map((url, idx) => ({
          key: `${panelId}-${idx}-${url}`,
          imageUrl: url,
          altLabel: labels.formatCandidateCountLabel(idx + 1),
          previewTitle: labels.enlargePreviewTitle,
          isSelected: idx === safeSelectedIndex,
          onSelect: () => onSelectCandidateIndex(panelId, idx),
          onPreview: onPreviewImage ? () => onPreviewImage(url) : undefined,
        })),
      } satisfies ComponentProps<typeof ImageSectionCandidateThumbnails>),
    [
      labels,
      onPreviewImage,
      onSelectCandidateIndex,
      panelId,
      safeSelectedIndex,
      validCandidates,
    ],
  )

  const actionsProps = useMemo(
    () =>
      ({
        cancelLabel: labels.cancelLabel,
        confirmLabel: labels.confirmLabel,
        panelId,
        isConfirming,
        confirmingState,
        onCancelCandidate,
        onConfirm,
      } satisfies ComponentProps<typeof ImageSectionCandidateActions>),
    [
      confirmingState,
      isConfirming,
      labels.cancelLabel,
      labels.confirmLabel,
      onCancelCandidate,
      onConfirm,
      panelId,
    ],
  )

  const statusBadgeProps = useMemo(
    () =>
      ({
        selectedCandidateLabel,
        pendingLabel:
          candidateData.candidates.length > validCandidates.length
            ? labels.formatPendingCandidateLabel(
                candidateData.candidates.length - validCandidates.length,
              )
            : null,
        visibleCandidateCount: validCandidates.length,
      } satisfies ComponentProps<typeof ImageSectionCandidateStatusBadge>),
    [candidateData.candidates.length, labels, selectedCandidateLabel, validCandidates.length],
  )

  return {
    previewTitle: labels.previewTitle,
    selectedCandidateLabel,
    thumbnailsProps,
    actionsProps,
    statusBadgeProps,
  }
}
