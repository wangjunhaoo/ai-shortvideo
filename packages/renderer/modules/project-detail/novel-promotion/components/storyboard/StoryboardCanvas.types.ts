'use client'

import { NovelPromotionClip, NovelPromotionPanel, NovelPromotionStoryboard } from '@/types/project'
import type { StoryboardPanel } from './hooks/useStoryboardState'
import type { PanelEditData } from '../PanelEditForm'
import type { VariantData, VariantOptions } from './hooks/usePanelVariant'
import type { PanelSaveState } from './hooks/usePanelCrudActions'

export interface StoryboardCanvasLabels {
  emptyTitle: string
  emptyDescription: string
  insertHereLabel: string
}

export interface StoryboardCanvasProps {
  labels: StoryboardCanvasLabels
  sortedStoryboards: NovelPromotionStoryboard[]
  videoRatio: string
  expandedClips: Set<string>
  submittingStoryboardIds: Set<string>
  selectingCandidateIds: Set<string>
  submittingStoryboardTextIds: Set<string>
  savingPanels: Set<string>
  deletingPanelIds: Set<string>
  saveStateByPanel: Record<string, PanelSaveState>
  hasUnsavedByPanel: Set<string>
  modifyingPanels: Set<string>
  submittingPanelImageIds: Set<string>
  movingClipId: string | null
  insertingAfterPanelId: string | null
  submittingVariantPanelId: string | null
  projectId: string
  episodeId: string
  storyboardStartIndex: Record<string, number>
  getClipInfo: (clipId: string) => NovelPromotionClip | undefined
  getTextPanels: (storyboard: NovelPromotionStoryboard) => StoryboardPanel[]
  getPanelEditData: (panel: StoryboardPanel) => PanelEditData
  formatClipTitle: (clip: NovelPromotionClip | undefined) => string
  onToggleExpandedClip: (storyboardId: string) => void
  onMoveStoryboardGroup: (clipId: string, direction: 'up' | 'down') => Promise<void>
  onRegenerateStoryboardText: (storyboardId: string) => Promise<void>
  onAddPanel: (storyboardId: string) => Promise<void>
  onDeleteStoryboard: (storyboardId: string, panelCount: number) => Promise<void>
  onGenerateAllIndividually: (storyboardId: string) => Promise<void>
  onPreviewImage: (url: string) => void
  onCloseStoryboardError: (storyboardId: string) => void
  onPanelUpdate: (panelId: string, panel: StoryboardPanel, updates: Partial<PanelEditData>) => void
  onPanelDelete: (
    panelId: string,
    storyboardId: string,
    setLocalStoryboards: React.Dispatch<React.SetStateAction<NovelPromotionStoryboard[]>>,
  ) => Promise<void>
  onOpenCharacterPicker: (panelId: string) => void
  onOpenLocationPicker: (panelId: string) => void
  onRemoveCharacter: (panel: StoryboardPanel, index: number, storyboardId: string) => void
  onRemoveLocation: (panel: StoryboardPanel, storyboardId: string) => void
  onRetryPanelSave: (panelId: string) => void
  onRegeneratePanelImage: (panelId: string, count?: number, force?: boolean) => void
  onOpenEditModal: (storyboardId: string, panelIndex: number) => void
  onOpenAIDataModal: (storyboardId: string, panelIndex: number) => void
  getPanelCandidates: (panel: NovelPromotionPanel) => { candidates: string[]; selectedIndex: number } | null
  onSelectPanelCandidateIndex: (panelId: string, index: number) => void
  onConfirmPanelCandidate: (panelId: string, imageUrl: string) => Promise<void>
  onCancelPanelCandidate: (panelId: string) => void
  onInsertPanel: (storyboardId: string, insertAfterPanelId: string, userInput: string) => Promise<void>
  onPanelVariant: (
    sourcePanelId: string,
    storyboardId: string,
    insertAfterPanelId: string,
    variant: VariantData,
    options: VariantOptions,
  ) => Promise<void>
  addStoryboardGroup: (insertIndex: number) => Promise<void>
  addingStoryboardGroup: boolean
  setLocalStoryboards: React.Dispatch<React.SetStateAction<NovelPromotionStoryboard[]>>
}
