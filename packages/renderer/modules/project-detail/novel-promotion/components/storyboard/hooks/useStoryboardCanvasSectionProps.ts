'use client'

import { useMemo, type ComponentProps } from 'react'
import StoryboardCanvas from '../StoryboardCanvas'
import type { StoryboardCanvasLabels } from '../StoryboardCanvas.types'
import type { useStoryboardStageController } from './useStoryboardStageController'

type StoryboardStageController = ReturnType<typeof useStoryboardStageController>

interface UseStoryboardCanvasSectionPropsParams {
  controller: StoryboardStageController
  projectId: string
  episodeId: string
  videoRatio: string
  labels: StoryboardCanvasLabels
}

export function useStoryboardCanvasSectionProps({
  controller,
  projectId,
  episodeId,
  videoRatio,
  labels,
}: UseStoryboardCanvasSectionPropsParams) {
  return useMemo(
    () =>
      ({
        labels,
        sortedStoryboards: controller.sortedStoryboards,
        videoRatio,
        expandedClips: controller.expandedClips,
        submittingStoryboardIds: controller.submittingStoryboardIds,
        selectingCandidateIds: controller.selectingCandidateIds,
        submittingStoryboardTextIds: controller.submittingStoryboardTextIds,
        savingPanels: controller.savingPanels,
        deletingPanelIds: controller.deletingPanelIds,
        saveStateByPanel: controller.saveStateByPanel,
        hasUnsavedByPanel: controller.hasUnsavedByPanel,
        modifyingPanels: controller.modifyingPanels,
        submittingPanelImageIds: controller.submittingPanelImageIds,
        movingClipId: controller.movingClipId,
        insertingAfterPanelId: controller.insertingAfterPanelId,
        submittingVariantPanelId: controller.submittingVariantPanelId,
        projectId,
        episodeId,
        storyboardStartIndex: controller.storyboardStartIndex,
        getClipInfo: controller.getClipInfo,
        getTextPanels: controller.getTextPanels,
        getPanelEditData: controller.getPanelEditData,
        formatClipTitle: controller.formatClipTitle,
        onToggleExpandedClip: controller.toggleExpandedClip,
        onMoveStoryboardGroup: controller.moveStoryboardGroup,
        onRegenerateStoryboardText: controller.regenerateStoryboardText,
        onAddPanel: controller.addPanel,
        onDeleteStoryboard: controller.deleteStoryboard,
        onGenerateAllIndividually: controller.regenerateAllPanelsIndividually,
        onPreviewImage: controller.setPreviewImage,
        onCloseStoryboardError: controller.clearStoryboardError,
        onPanelUpdate: controller.handlePanelUpdate,
        onPanelDelete: controller.deletePanel,
        onOpenCharacterPicker: (panelId: string) =>
          controller.setAssetPickerPanel({ panelId, type: 'character' }),
        onOpenLocationPicker: (panelId: string) =>
          controller.setAssetPickerPanel({ panelId, type: 'location' }),
        onRemoveCharacter: controller.handleRemoveCharacter,
        onRemoveLocation: controller.handleRemoveLocation,
        onRetryPanelSave: controller.retrySave,
        onRegeneratePanelImage: controller.regeneratePanelImage,
        onOpenEditModal: (storyboardId: string, panelIndex: number) =>
          controller.setEditingPanel({ storyboardId, panelIndex }),
        onOpenAIDataModal: (storyboardId: string, panelIndex: number) =>
          controller.setAIDataPanel({ storyboardId, panelIndex }),
        getPanelCandidates: controller.getPanelCandidates,
        onSelectPanelCandidateIndex: controller.selectPanelCandidateIndex,
        onConfirmPanelCandidate: controller.selectPanelCandidate,
        onCancelPanelCandidate: controller.cancelPanelCandidate,
        onInsertPanel: controller.insertPanel,
        onPanelVariant: controller.generatePanelVariant,
        addStoryboardGroup: controller.addStoryboardGroup,
        addingStoryboardGroup: controller.addingStoryboardGroup,
        setLocalStoryboards: controller.setLocalStoryboards,
      }) satisfies ComponentProps<typeof StoryboardCanvas>,
    [
      controller.addPanel,
      controller.addStoryboardGroup,
      controller.addingStoryboardGroup,
      controller.cancelPanelCandidate,
      controller.clearStoryboardError,
      controller.deletePanel,
      controller.deleteStoryboard,
      controller.deletingPanelIds,
      controller.expandedClips,
      controller.formatClipTitle,
      controller.generatePanelVariant,
      controller.getClipInfo,
      controller.getPanelCandidates,
      controller.getPanelEditData,
      controller.getTextPanels,
      controller.handlePanelUpdate,
      controller.handleRemoveCharacter,
      controller.handleRemoveLocation,
      controller.hasUnsavedByPanel,
      controller.insertingAfterPanelId,
      controller.insertPanel,
      controller.modifyingPanels,
      controller.moveStoryboardGroup,
      controller.movingClipId,
      controller.regenerateAllPanelsIndividually,
      controller.regeneratePanelImage,
      controller.regenerateStoryboardText,
      controller.retrySave,
      controller.saveStateByPanel,
      controller.savingPanels,
      controller.selectingCandidateIds,
      controller.selectPanelCandidate,
      controller.selectPanelCandidateIndex,
      controller.setAIDataPanel,
      controller.setAssetPickerPanel,
      controller.setEditingPanel,
      controller.setLocalStoryboards,
      controller.setPreviewImage,
      controller.sortedStoryboards,
      controller.storyboardStartIndex,
      controller.submittingPanelImageIds,
      controller.submittingStoryboardIds,
      controller.submittingStoryboardTextIds,
      controller.submittingVariantPanelId,
      controller.toggleExpandedClip,
      episodeId,
      labels,
      projectId,
      videoRatio,
    ],
  )
}
