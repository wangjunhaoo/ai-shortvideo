'use client'
import { createPortal } from 'react-dom'
import { usePanelVariantModalState } from './hooks/usePanelVariantModalState'
import PanelVariantModalContent from './PanelVariantModalContent'
import PanelVariantModalFooter from './PanelVariantModalFooter'
import PanelVariantModalHeader from './PanelVariantModalHeader'
import type { PanelVariantModalProps } from './PanelVariantModal.types'

export default function PanelVariantModal({
  isOpen,
  onClose,
  panel,
  projectId,
  labels,
  messages,
  onVariant,
  isSubmittingVariantTask,
}: PanelVariantModalProps) {
  const {
    mounted,
    isAnalyzing,
    suggestions,
    error,
    customInput,
    includeCharacterAssets,
    includeLocationAsset,
    selectedVariantId,
    variantTaskRunningState,
    analyzeTaskRunningState,
    setCustomInput,
    setIncludeCharacterAssets,
    setIncludeLocationAsset,
    analyzeShotVariants,
    handleSelectVariant,
    handleCustomVariant,
    handleClose,
  } = usePanelVariantModalState({
    isOpen,
    panel,
    projectId,
    messages,
    onClose,
    onVariant,
    isSubmittingVariantTask,
  })

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div
      className="fixed inset-0 glass-overlay flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={handleClose}
    >
      <div
        className="glass-surface-modal w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <PanelVariantModalHeader
          labels={{
            title: labels.header.formatTitle(panel.panelNumber ?? ''),
          }}
          isDisabled={isSubmittingVariantTask || isAnalyzing}
          onClose={handleClose}
        />

        <PanelVariantModalContent
          panel={panel}
          panelInfoLabels={{
            imageAlt: labels.panelInfo.formatImageAlt(panel.panelNumber ?? ''),
            noImageLabel: labels.panelInfo.noImageLabel,
            originalDescriptionLabel: labels.panelInfo.originalDescriptionLabel,
            noDescriptionLabel: labels.panelInfo.noDescriptionLabel,
          }}
          customOptionLabels={labels.customOptions}
          suggestionListLabels={labels.suggestionList}
          isAnalyzing={isAnalyzing}
          suggestions={suggestions}
          error={error}
          selectedVariantId={selectedVariantId}
          isSubmittingVariantTask={isSubmittingVariantTask}
          analyzeTaskRunningState={analyzeTaskRunningState}
          variantTaskRunningState={variantTaskRunningState}
          customInput={customInput}
          includeCharacterAssets={includeCharacterAssets}
          includeLocationAsset={includeLocationAsset}
          onReanalyze={analyzeShotVariants}
          onSelectVariant={(suggestion) => {
            void handleSelectVariant(suggestion)
          }}
          onCustomInputChange={setCustomInput}
          onIncludeCharacterAssetsChange={setIncludeCharacterAssets}
          onIncludeLocationAssetChange={setIncludeLocationAsset}
        />

        <PanelVariantModalFooter
          labels={labels.footer}
          isSubmittingVariantTask={isSubmittingVariantTask}
          isAnalyzing={isAnalyzing}
          customInput={customInput}
          variantTaskRunningState={variantTaskRunningState}
          onClose={handleClose}
          onSubmitCustom={() => {
            void handleCustomVariant()
          }}
        />
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
