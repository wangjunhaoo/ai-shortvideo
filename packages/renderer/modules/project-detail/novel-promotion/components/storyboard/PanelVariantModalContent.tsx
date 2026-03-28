'use client'

import PanelVariantModalCustomOptions from './PanelVariantModalCustomOptions'
import PanelVariantModalPanelInfo from './PanelVariantModalPanelInfo'
import PanelVariantModalSuggestionList from './PanelVariantModalSuggestionList'
import type { PanelVariantModalContentProps } from './PanelVariantModal.types'

export default function PanelVariantModalContent({
  panel,
  panelInfoLabels,
  customOptionLabels,
  suggestionListLabels,
  isAnalyzing,
  suggestions,
  error,
  selectedVariantId,
  isSubmittingVariantTask,
  analyzeTaskRunningState,
  variantTaskRunningState,
  customInput,
  includeCharacterAssets,
  includeLocationAsset,
  onReanalyze,
  onSelectVariant,
  onCustomInputChange,
  onIncludeCharacterAssetsChange,
  onIncludeLocationAssetChange,
}: PanelVariantModalContentProps) {
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      <PanelVariantModalPanelInfo labels={panelInfoLabels} panel={panel} />

      <div className="glass-divider" />

      <PanelVariantModalSuggestionList
        labels={suggestionListLabels}
        isAnalyzing={isAnalyzing}
        suggestions={suggestions}
        error={error}
        selectedVariantId={selectedVariantId}
        isSubmittingVariantTask={isSubmittingVariantTask}
        analyzeTaskRunningState={analyzeTaskRunningState}
        variantTaskRunningState={variantTaskRunningState}
        onReanalyze={onReanalyze}
        onSelectVariant={onSelectVariant}
      />

      <div className="glass-divider" />

      <PanelVariantModalCustomOptions
        labels={customOptionLabels}
        customInput={customInput}
        includeCharacterAssets={includeCharacterAssets}
        includeLocationAsset={includeLocationAsset}
        isSubmittingVariantTask={isSubmittingVariantTask}
        onCustomInputChange={onCustomInputChange}
        onIncludeCharacterAssetsChange={onIncludeCharacterAssetsChange}
        onIncludeLocationAssetChange={onIncludeLocationAssetChange}
      />
    </div>
  )
}
