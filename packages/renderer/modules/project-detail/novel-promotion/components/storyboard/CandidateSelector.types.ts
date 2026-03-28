'use client'

export interface CandidateSelectorProps {
  originalImageUrl: string | null
  candidates: string[]
  selectedIndex: number
  videoRatio: string
  onSelect: (index: number) => void
  onConfirm: () => void
  onCancel: () => void
  onPreview: (imageUrl: string) => void
  getImageUrl: (url: string | null) => string | null
  labels: CandidateSelectorLabels
}

export interface CandidateSelectorLabels {
  title: string
  subtitle: string
  originalLabel: string
  fallbackText: string
  cancelLabel: string
  confirmLabel: string
  confirmPrefixLabel: string
  candidateLabel: (count: number) => string
}

export interface CandidateSelectorHeaderProps {
  title: string
  subtitle: string
  isConfirming: boolean
  onCancel: () => void
}

export interface CandidateSelectorThumbnailProps {
  label: string
  alt: string
  imageUrl: string | null
  fallbackText: string
  isSelected: boolean
  width: number
  height: number
  onClick: () => void
}

export interface CandidateSelectorThumbnailItem {
  key: string
  label: string
  alt: string
  imageUrl: string | null
  isSelected: boolean
  width: number
  height: number
  onClick: () => void
}

export interface CandidateSelectorThumbnailStripProps {
  items: CandidateSelectorThumbnailItem[]
  fallbackText: string
}

export interface CandidateSelectorFooterProps {
  confirmPrefixLabel: string
  selectedLabel: string
  cancelLabel: string
  confirmLabel: string
  isConfirming: boolean
  confirmingState: import('@/lib/task/presentation').TaskPresentationState | null
  onCancel: () => void
  onConfirm: () => void
}
