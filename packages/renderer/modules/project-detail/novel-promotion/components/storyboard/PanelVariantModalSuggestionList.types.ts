'use client'

import type { TaskPresentationState } from '@/lib/task/presentation'
import type {
  PanelVariantModalSuggestionListLabels,
  PanelVariantSuggestionItemLabels,
  ShotVariantSuggestion,
} from './PanelVariantModal.types'

export interface PanelVariantModalSuggestionListProps {
  labels: PanelVariantModalSuggestionListLabels
  isAnalyzing: boolean
  suggestions: ShotVariantSuggestion[]
  error: string | null
  selectedVariantId: number | null
  isSubmittingVariantTask: boolean
  analyzeTaskRunningState: TaskPresentationState | null
  variantTaskRunningState: TaskPresentationState | null
  onReanalyze: () => void
  onSelectVariant: (suggestion: ShotVariantSuggestion) => void
}

export interface PanelVariantSuggestionItemProps {
  labels: PanelVariantSuggestionItemLabels
  suggestion: ShotVariantSuggestion
  selectedVariantId: number | null
  isSubmittingVariantTask: boolean
  variantTaskRunningState: TaskPresentationState | null
  onSelectVariant: (suggestion: ShotVariantSuggestion) => void
}
