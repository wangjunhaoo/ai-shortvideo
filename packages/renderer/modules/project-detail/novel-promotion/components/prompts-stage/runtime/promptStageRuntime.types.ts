'use client'

import type { AssetLibraryCharacter, AssetLibraryLocation, NovelPromotionShot } from '@/types/project'

export interface PromptsStageShellProps {
  projectId: string
  shots: NovelPromotionShot[]
  viewMode: 'card' | 'table'
  onViewModeChange: (mode: 'card' | 'table') => void
  onGenerateImage: (shotId: string, extraReferenceAssetIds?: string[]) => void
  onGenerateAllImages: () => void
  isBatchSubmitting?: boolean
  onBack?: () => void
  onNext: () => void
  onUpdatePrompt: (shotId: string, field: 'imagePrompt', value: string) => Promise<void>
  artStyle: string
  assetLibraryCharacters: AssetLibraryCharacter[]
  assetLibraryLocations: AssetLibraryLocation[]
  onAppendContent?: (content: string) => Promise<void>
}

export type LocationAssetWithImages = AssetLibraryLocation & {
  selectedImageId?: string | null
  images?: Array<{
    id: string
    isSelected?: boolean
    imageUrl?: string | null
    description?: string | null
  }>
}

export interface PromptAssetReference {
  id: string
  name: string
  description: string
  type: 'character' | 'location'
}

export interface PromptShotEditState {
  editValue: string
  aiModifyInstruction: string
  selectedAssets: PromptAssetReference[]
  showAssetPicker: boolean
}

export interface PromptEditingTarget {
  shotId: string
  field: 'imagePrompt'
}

export interface PromptStageToolbarLabels {
  backLabel: string
  panelsLabel: string
  generatingLabel: string
  generateAllLabel: string
  previewLabel: string
  statusLabel: string
}

export interface PromptStageCardLabels {
  shotAlt: (shotId: string | number) => string
  regenerateImageTitle: string
  imagePromptLabel: string
  currentPromptLabel: string
  aiInstructionLabel: string
  supportReferenceLabel: string
  instructionPlaceholder: string
  selectAssetLabel: string
  characterLabel: string
  locationLabel: string
  referencedAssetsLabel: string
  removeAssetTitle: string
  aiModifyTip: string
  aiModifyLabel: string
  saveLabel: string
  cancelLabel: string
  shotTypeLabel: string
  locationFieldLabel: string
  modeLabel: string
  generateLabel: string
  hasSyncedLabel: string
}

export interface PromptStageTableLabels {
  shotLabel: string
  previewLabel: string
  actionsLabel: string
  generateLabel: string
  imagePromptTitle: string
  shotAlt: (shotId: string | number) => string
}

export interface PromptAppendSectionLabels {
  title: string
  description: string
  placeholder: string
  submitLabel: string
}

export interface PromptStageNextButtonLabels {
  enterVideoGenerationLabel: string
}

export interface PromptStageLabels {
  toolbar: PromptStageToolbarLabels
  cardView: PromptStageCardLabels
  tableView: PromptStageTableLabels
  appendSection: PromptAppendSectionLabels
  nextButton: PromptStageNextButtonLabels
}

export interface PromptEditorMessages {
  unknownError: string
  updateFailed: (error: string) => string
  enterInstruction: string
  modifyFailed: (error: string) => string
}

export interface PromptAppendMessages {
  unknownError: string
  enterContinuation: string
  appendSuccess: string
  appendFailed: (error: string) => string
}
