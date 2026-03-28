'use client'

export interface ImageSectionActionLabels {
  regenerateLabel: string
  forceRegenerateLabel: string
  generateCountSuffix: string
  selectCountAriaLabel: string
  viewDataLabel: string
  editImageLabel: string
  undoLabel: string
}

export interface ImageSectionActionButtonsProps {
  labels: ImageSectionActionLabels
  panelId: string
  imageUrl: string | null
  previousImageUrl?: string | null
  isSubmittingPanelImageTask: boolean
  isModifying: boolean
  onRegeneratePanelImage: (
    panelId: string,
    count?: number,
    force?: boolean,
  ) => void
  onOpenEditModal: () => void
  onOpenAIDataModal: () => void
  onUndo?: (panelId: string) => void
  triggerPulse: () => void
}
