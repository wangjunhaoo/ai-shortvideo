'use client'
import PanelVariantModalSuggestionEmptyState from './PanelVariantModalSuggestionEmptyState'
import PanelVariantModalSuggestionListHeader from './PanelVariantModalSuggestionListHeader'
import PanelVariantSuggestionItem from './PanelVariantSuggestionItem'
import type { PanelVariantModalSuggestionListProps } from './PanelVariantModalSuggestionList.types'

export default function PanelVariantModalSuggestionList({
  labels,
  isAnalyzing,
  suggestions,
  error,
  selectedVariantId,
  isSubmittingVariantTask,
  analyzeTaskRunningState,
  variantTaskRunningState,
  onReanalyze,
  onSelectVariant,
}: PanelVariantModalSuggestionListProps) {
  return (
    <div>
      <PanelVariantModalSuggestionListHeader
        title={labels.title}
        reanalyzeLabel={labels.reanalyzeLabel}
        isAnalyzing={isAnalyzing}
        suggestionsCount={suggestions.length}
        analyzeTaskRunningState={analyzeTaskRunningState}
        onReanalyze={onReanalyze}
      />

      {error && (
        <div className="p-3 bg-[var(--glass-tone-danger-bg)] text-[var(--glass-tone-danger-fg)] text-sm rounded-lg mb-3 border border-[var(--glass-stroke-danger)]">
          {error}
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {suggestions.map((suggestion) => (
          <PanelVariantSuggestionItem
            key={suggestion.id}
            labels={labels.item}
            suggestion={suggestion}
            selectedVariantId={selectedVariantId}
            isSubmittingVariantTask={isSubmittingVariantTask}
            variantTaskRunningState={variantTaskRunningState}
            onSelectVariant={onSelectVariant}
          />
        ))}

        {!isAnalyzing && suggestions.length === 0 && !error && (
          <PanelVariantModalSuggestionEmptyState
            message={labels.emptyMessage}
          />
        )}
      </div>
    </div>
  )
}
