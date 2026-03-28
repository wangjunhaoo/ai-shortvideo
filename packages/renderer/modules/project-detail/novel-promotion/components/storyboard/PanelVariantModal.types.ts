export interface ShotVariantSuggestion {
  id: number
  title: string
  description: string
  shot_type: string
  camera_move: string
  video_prompt: string
  creative_score: number
}

export interface PanelInfo {
  id: string
  panelNumber: number | null
  description: string | null
  imageUrl: string | null
  storyboardId: string
}

export interface PanelVariantModalProps {
  isOpen: boolean
  onClose: () => void
  panel: PanelInfo
  projectId: string
  labels: PanelVariantModalRootLabels
  messages: PanelVariantModalStateMessages
  onVariant: (
    variant: Omit<ShotVariantSuggestion, 'id' | 'creative_score'>,
    options: { includeCharacterAssets: boolean; includeLocationAsset: boolean },
  ) => Promise<void>
  isSubmittingVariantTask: boolean
}

export interface PanelVariantModalRootLabels {
  header: {
    formatTitle: (number: number | '') => string
  }
  footer: PanelVariantModalFooterLabels
  panelInfo: {
    formatImageAlt: (number: number | '') => string
    noImageLabel: string
    originalDescriptionLabel: string
    noDescriptionLabel: string
  }
  customOptions: PanelVariantModalCustomOptionsLabels
  suggestionList: PanelVariantModalSuggestionListLabels
}

export interface PanelVariantModalHeaderLabels {
  title: string
}

export interface PanelVariantModalHeaderProps {
  labels: PanelVariantModalHeaderLabels
  isDisabled: boolean
  onClose: () => void
}

export interface PanelVariantModalFooterLabels {
  cancelLabel: string
  submitLabel: string
}

export interface PanelVariantModalStateMessages {
  analyzeFailed: string
  customVariantTitle: string
  defaultShotType: string
  defaultCameraMove: string
}

export interface PanelVariantModalPanelInfoLabels {
  imageAlt: string
  noImageLabel: string
  originalDescriptionLabel: string
  noDescriptionLabel: string
}

export interface PanelVariantModalCustomOptionsLabels {
  title: string
  placeholder: string
  includeCharacterLabel: string
  includeLocationLabel: string
}

export interface PanelVariantSuggestionItemLabels {
  formatCreativeScore: (score: number) => string
  shotTypeLabel: string
  cameraMoveLabel: string
  selectLabel: string
}

export interface PanelVariantModalSuggestionListLabels {
  title: string
  reanalyzeLabel: string
  emptyMessage: string
  item: PanelVariantSuggestionItemLabels
}

export interface PanelVariantModalContentProps {
  panel: PanelInfo
  panelInfoLabels: PanelVariantModalPanelInfoLabels
  customOptionLabels: PanelVariantModalCustomOptionsLabels
  suggestionListLabels: PanelVariantModalSuggestionListLabels
  isAnalyzing: boolean
  suggestions: ShotVariantSuggestion[]
  error: string | null
  selectedVariantId: number | null
  isSubmittingVariantTask: boolean
  analyzeTaskRunningState: import('@/lib/task/presentation').TaskPresentationState | null
  variantTaskRunningState: import('@/lib/task/presentation').TaskPresentationState | null
  customInput: string
  includeCharacterAssets: boolean
  includeLocationAsset: boolean
  onReanalyze: () => Promise<void>
  onSelectVariant: (suggestion: ShotVariantSuggestion) => void
  onCustomInputChange: (value: string) => void
  onIncludeCharacterAssetsChange: (checked: boolean) => void
  onIncludeLocationAssetChange: (checked: boolean) => void
}
