'use client'

import type { NovelPromotionPanel } from '@/types/project'
import type { StoryboardPanel } from './hooks/useStoryboardState'
import type { PanelCardLabels } from './PanelCard.types'
import type { PanelEditData } from '../PanelEditForm'
import type { PanelSaveState } from './hooks/usePanelCrudActions'

export interface StoryboardPanelListProps {
  storyboardId: string
  textPanels: StoryboardPanel[]
  panelCardLabels: PanelCardLabels
  storyboardStartIndex: number
  videoRatio: string
  isSubmittingStoryboardTextTask: boolean
  savingPanels: Set<string>
  deletingPanelIds: Set<string>
  saveStateByPanel: Record<string, PanelSaveState>
  hasUnsavedByPanel: Set<string>
  modifyingPanels: Set<string>
  panelTaskErrorMap: Map<string, { taskId: string; message: string }>
  isPanelTaskRunning: (panel: StoryboardPanel) => boolean
  getPanelEditData: (panel: StoryboardPanel) => PanelEditData
  getPanelCandidates: (
    panel: NovelPromotionPanel,
  ) => { candidates: string[]; selectedIndex: number } | null
  onPanelUpdate: (
    panelId: string,
    panel: StoryboardPanel,
    updates: Partial<PanelEditData>,
  ) => void
  onPanelDelete: (panelId: string) => void
  onOpenCharacterPicker: (panelId: string) => void
  onOpenLocationPicker: (panelId: string) => void
  onRemoveCharacter: (panel: StoryboardPanel, index: number) => void
  onRemoveLocation: (panel: StoryboardPanel) => void
  onRetryPanelSave: (panelId: string) => void
  onRegeneratePanelImage: (
    panelId: string,
    count?: number,
    force?: boolean,
  ) => void
  onOpenEditModal: (panelIndex: number) => void
  onOpenAIDataModal: (panelIndex: number) => void
  onSelectPanelCandidateIndex: (panelId: string, index: number) => void
  onConfirmPanelCandidate: (panelId: string, imageUrl: string) => Promise<void>
  onCancelPanelCandidate: (panelId: string) => void
  onClearPanelTaskError: (panelId: string) => void
  onPreviewImage: (url: string) => void
  onInsertAfter: (panelIndex: number) => void
  onVariant: (panelIndex: number) => void
  isInsertDisabled: (panelId: string) => boolean
}

export interface StoryboardPanelListItemViewModel {
  panel: StoryboardPanel
  index: number
  imageUrl: string | null
  globalPanelNumber: number
  isPanelModifying: boolean
  isPanelDeleting: boolean
  isPanelSaving: boolean
  hasUnsavedChanges: boolean
  panelSaveError: string | null
  panelTaskRunning: boolean
  panelFailedError: string | null
  panelData: PanelEditData
  panelCandidateData: { candidates: string[]; selectedIndex: number } | null
}

export interface StoryboardPanelListItemProps {
  storyboardId: string
  panelCardLabels: PanelCardLabels
  videoRatio: string
  totalPanels: number
  item: StoryboardPanelListItemViewModel
  onPanelUpdate: (
    panelId: string,
    panel: StoryboardPanel,
    updates: Partial<PanelEditData>,
  ) => void
  onPanelDelete: (panelId: string) => void
  onOpenCharacterPicker: (panelId: string) => void
  onOpenLocationPicker: (panelId: string) => void
  onRemoveCharacter: (panel: StoryboardPanel, index: number) => void
  onRemoveLocation: (panel: StoryboardPanel) => void
  onRetryPanelSave: (panelId: string) => void
  onRegeneratePanelImage: (
    panelId: string,
    count?: number,
    force?: boolean,
  ) => void
  onOpenEditModal: (panelIndex: number) => void
  onOpenAIDataModal: (panelIndex: number) => void
  onSelectPanelCandidateIndex: (panelId: string, index: number) => void
  onConfirmPanelCandidate: (panelId: string, imageUrl: string) => Promise<void>
  onCancelPanelCandidate: (panelId: string) => void
  onClearPanelTaskError: (panelId: string) => void
  onPreviewImage: (url: string) => void
  onInsertAfter: (panelIndex: number) => void
  onVariant: (panelIndex: number) => void
  isInsertDisabled: (panelId: string) => boolean
}
