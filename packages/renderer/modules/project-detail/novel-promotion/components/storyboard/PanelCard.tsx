'use client'

import ImageSection from './ImageSection'
import { GlassSurface } from '@/components/ui/primitives'
import PanelCardDeleteButton from './PanelCardDeleteButton'
import PanelCardEditorSection from './PanelCardEditorSection'
import PanelCardSideActions from './PanelCardSideActions'
import type { PanelCardProps } from './PanelCard.types'
import { usePanelCardSectionProps } from './hooks/usePanelCardSectionProps'

export default function PanelCard({
  panel,
  panelData,
  labels,
  imageUrl,
  globalPanelNumber,
  storyboardId,
  videoRatio,
  isSaving,
  hasUnsavedChanges = false,
  saveErrorMessage = null,
  isDeleting,
  isModifying,
  isSubmittingPanelImageTask,
  failedError,
  candidateData,
  previousImageUrl,
  onUpdate,
  onDelete,
  onOpenCharacterPicker,
  onOpenLocationPicker,
  onRetrySave,
  onRemoveCharacter,
  onRemoveLocation,
  onRegeneratePanelImage,
  onOpenEditModal,
  onOpenAIDataModal,
  onSelectCandidateIndex,
  onConfirmCandidate,
  onCancelCandidate,
  onClearError,
  onUndo,
  onPreviewImage,
  onInsertAfter,
  onVariant,
  isInsertDisabled,
}: PanelCardProps) {
  const {
    imageSectionProps,
    sideActionsProps,
    editorSectionProps,
  } = usePanelCardSectionProps({
    panel,
    panelData,
    imageUrl,
    globalPanelNumber,
    storyboardId,
    videoRatio,
    isSaving,
    hasUnsavedChanges,
    saveErrorMessage,
    isDeleting,
    isModifying,
    isSubmittingPanelImageTask,
    failedError,
    candidateData,
    previousImageUrl,
    onUpdate,
    onDelete,
    onOpenCharacterPicker,
    onOpenLocationPicker,
    onRetrySave,
    onRemoveCharacter,
    onRemoveLocation,
    onRegeneratePanelImage,
    onOpenEditModal,
    onOpenAIDataModal,
    onSelectCandidateIndex,
    onConfirmCandidate,
    onCancelCandidate,
    onClearError,
    onUndo,
    onPreviewImage,
    imageSectionLabels: labels.imageSection,
    sideActionLabels: labels.sideActions,
    onInsertAfter,
    onVariant,
    isInsertDisabled,
  })

  return (
    <GlassSurface
      variant="elevated"
      padded={false}
      className="relative h-full overflow-visible transition-all hover:shadow-[var(--glass-shadow-md)] group/card"
      data-storyboard-id={storyboardId}
    >
      {!isModifying && !isDeleting && (
        <PanelCardDeleteButton
          title={labels.deleteTitle}
          onDelete={onDelete}
        />
      )}

      <div className="relative">
        <ImageSection {...imageSectionProps} />
        <PanelCardSideActions {...sideActionsProps} />
      </div>

      <PanelCardEditorSection {...editorSectionProps} />
    </GlassSurface>
  )
}
