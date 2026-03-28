'use client'

import type { PanelCardProps } from '../PanelCard.types'
import type { ImageSectionLabels } from '../ImageSection.types'
import type { PanelActionLabels } from '../PanelActionButtons.types'

type PanelCardSectionPropsResult = {
  imageSectionProps: {
    panelId: string
    imageUrl: string | null
    globalPanelNumber: number
    shotType: string
    videoRatio: string
    isDeleting: boolean
    isModifying: boolean
    isSubmittingPanelImageTask: boolean
    failedError: string | null
    candidateData: PanelCardProps['candidateData']
    previousImageUrl?: string | null
    onRegeneratePanelImage: PanelCardProps['onRegeneratePanelImage']
    onOpenEditModal: PanelCardProps['onOpenEditModal']
    onOpenAIDataModal: PanelCardProps['onOpenAIDataModal']
    onSelectCandidateIndex: PanelCardProps['onSelectCandidateIndex']
    onConfirmCandidate: PanelCardProps['onConfirmCandidate']
    onCancelCandidate: PanelCardProps['onCancelCandidate']
    onClearError: PanelCardProps['onClearError']
    onUndo: PanelCardProps['onUndo']
    onPreviewImage: PanelCardProps['onPreviewImage']
    labels: ImageSectionLabels
  }
  sideActionsProps: {
    labels: PanelActionLabels
    onInsertAfter: PanelCardProps['onInsertAfter']
    onVariant: PanelCardProps['onVariant']
    disabled: PanelCardProps['isInsertDisabled']
    hasImage: boolean
  }
  editorSectionProps: {
    panelData: PanelCardProps['panelData']
    isSaving: boolean
    hasUnsavedChanges: boolean
    saveErrorMessage: string | null
    onRetrySave: PanelCardProps['onRetrySave']
    onUpdate: PanelCardProps['onUpdate']
    onOpenCharacterPicker: PanelCardProps['onOpenCharacterPicker']
    onOpenLocationPicker: PanelCardProps['onOpenLocationPicker']
    onRemoveCharacter: PanelCardProps['onRemoveCharacter']
    onRemoveLocation: PanelCardProps['onRemoveLocation']
  }
}

export function usePanelCardSectionProps({
  panel,
  panelData,
  imageUrl,
  globalPanelNumber,
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
  imageSectionLabels,
  sideActionLabels,
  onInsertAfter,
  onVariant,
  isInsertDisabled,
}: Omit<PanelCardProps, 'labels'> & {
  imageSectionLabels: ImageSectionLabels
  sideActionLabels: PanelActionLabels
}): PanelCardSectionPropsResult {
  return {
    imageSectionProps: {
      panelId: panel.id,
      imageUrl,
      globalPanelNumber,
      shotType: panel.shot_type,
      videoRatio,
      isDeleting,
      isModifying,
      isSubmittingPanelImageTask,
      failedError,
      candidateData,
      previousImageUrl,
      onRegeneratePanelImage,
      onOpenEditModal,
      onOpenAIDataModal,
      onSelectCandidateIndex,
      onConfirmCandidate,
      onCancelCandidate,
      onClearError,
      onUndo,
      onPreviewImage,
      labels: imageSectionLabels,
    },
    sideActionsProps: {
      labels: sideActionLabels,
      onInsertAfter,
      onVariant,
      disabled: isInsertDisabled,
      hasImage: !!imageUrl,
    },
    editorSectionProps: {
      panelData,
      isSaving,
      hasUnsavedChanges,
      saveErrorMessage,
      onRetrySave,
      onUpdate,
      onOpenCharacterPicker,
      onOpenLocationPicker,
      onRemoveCharacter,
      onRemoveLocation,
    },
  }
}
