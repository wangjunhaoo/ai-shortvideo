'use client'

export interface PanelInfo {
  id: string
  panelNumber: number | null
  description: string | null
  imageUrl: string | null
}

export interface InsertPanelModalPreviewLabels {
  noImageFallback: string
  insertLabel: string
  insertAtEndFallback: string
}

export interface InsertPanelModalActionLabels {
  aiAnalyzeLabel: string
  insertLabel: string
}

export interface InsertPanelModalLabels {
  formatTitle: (before: number, after: number | '') => string
  placeholder: string
  preview: InsertPanelModalPreviewLabels
  actions: InsertPanelModalActionLabels
}

export interface InsertPanelModalProps {
  isOpen: boolean
  onClose: () => void
  prevPanel: PanelInfo
  nextPanel: PanelInfo | null
  labels: InsertPanelModalLabels
  onInsert: (userInput: string) => Promise<void>
  isInserting: boolean
}
