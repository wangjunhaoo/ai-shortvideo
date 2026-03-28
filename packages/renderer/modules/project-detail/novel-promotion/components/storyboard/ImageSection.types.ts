'use client'

import type { ImageSectionActionLabels } from './ImageSectionActionButtons.types'

export interface PanelCandidateData {
  candidates: string[]
  selectedIndex: number
}

export interface ImageSectionStatusLabels {
  loadingAlt: string
  failedLabel: string
  closeLabel: string
  emptyLabel: string
  generateLabel: string
}

export interface ImageSectionCandidateLabels {
  previewTitle: string
  enlargePreviewTitle: string
  cancelLabel: string
  confirmLabel: string
  formatCandidateCountLabel: (count: number) => string
  formatPendingCandidateLabel: (count: number) => string
}

export interface ImageSectionContentLabels {
  formatShotNumberLabel: (number: number) => string
  previewTitle: string
  status: ImageSectionStatusLabels
  candidate: ImageSectionCandidateLabels
}

export interface ImageSectionLabels {
  content: ImageSectionContentLabels
  actions: ImageSectionActionLabels
}

export interface ImageSectionProps {
  panelId: string
  imageUrl: string | null
  globalPanelNumber: number
  shotType: string
  videoRatio: string
  isDeleting: boolean
  isModifying: boolean
  isSubmittingPanelImageTask: boolean
  failedError: string | null
  candidateData: PanelCandidateData | null
  previousImageUrl?: string | null
  onRegeneratePanelImage: (
    panelId: string,
    count?: number,
    force?: boolean,
  ) => void
  onOpenEditModal: () => void
  onOpenAIDataModal: () => void
  onSelectCandidateIndex: (panelId: string, index: number) => void
  onConfirmCandidate: (panelId: string, imageUrl: string) => Promise<void>
  onCancelCandidate: (panelId: string) => void
  onClearError: () => void
  onUndo?: (panelId: string) => void
  onPreviewImage?: (url: string) => void
  labels: ImageSectionLabels
}
