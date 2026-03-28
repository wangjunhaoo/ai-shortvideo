'use client'

import type { PanelEditData } from '../PanelEditForm'
import type { PanelActionLabels } from './PanelActionButtons.types'
import type { ImageSectionLabels } from './ImageSection.types'
import type { StoryboardPanel } from './hooks/useStoryboardState'

export interface PanelCandidateData {
  candidates: string[]
  selectedIndex: number
}

export interface PanelCardLabels {
  deleteTitle: string
  imageSection: ImageSectionLabels
  sideActions: PanelActionLabels
}

export interface PanelCardProps {
  panel: StoryboardPanel
  panelData: PanelEditData
  labels: PanelCardLabels
  imageUrl: string | null
  globalPanelNumber: number
  storyboardId: string
  videoRatio: string
  isSaving: boolean
  hasUnsavedChanges?: boolean
  saveErrorMessage?: string | null
  isDeleting: boolean
  isModifying: boolean
  isSubmittingPanelImageTask: boolean
  failedError: string | null
  candidateData: PanelCandidateData | null
  previousImageUrl?: string | null
  onUpdate: (updates: Partial<PanelEditData>) => void
  onDelete: () => void
  onOpenCharacterPicker: () => void
  onOpenLocationPicker: () => void
  onRetrySave?: () => void
  onRemoveCharacter: (index: number) => void
  onRemoveLocation: () => void
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
  onInsertAfter?: () => void
  onVariant?: () => void
  isInsertDisabled?: boolean
}
