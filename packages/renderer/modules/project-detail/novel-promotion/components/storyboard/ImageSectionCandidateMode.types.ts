'use client'

import type { TaskPresentationState } from '@/lib/task/presentation'
import type { ImageSectionCandidateLabels, PanelCandidateData } from './ImageSection.types'

export interface ImageSectionCandidateModeProps {
  panelId: string
  imageUrl: string | null
  candidateData: PanelCandidateData
  labels: ImageSectionCandidateLabels
  onSelectCandidateIndex: (panelId: string, index: number) => void
  onConfirmCandidate: (panelId: string, imageUrl: string) => Promise<void>
  onCancelCandidate: (panelId: string) => void
  onPreviewImage?: (url: string) => void
}

export interface ImageSectionCandidateThumbnailsProps {
  items: ImageSectionCandidateThumbnailItem[]
}

export interface ImageSectionCandidateThumbnailItem {
  key: string
  imageUrl: string
  altLabel: string
  previewTitle: string
  isSelected: boolean
  onSelect: () => void
  onPreview?: () => void
}

export interface ImageSectionCandidateActionsProps {
  cancelLabel: string
  confirmLabel: string
  panelId: string
  isConfirming: boolean
  confirmingState: TaskPresentationState | null
  onCancelCandidate: (panelId: string) => void
  onConfirm: () => Promise<void>
}

export interface ImageSectionCandidateStatusBadgeProps {
  selectedCandidateLabel: string
  visibleCandidateCount: number
  pendingLabel: string | null
}
