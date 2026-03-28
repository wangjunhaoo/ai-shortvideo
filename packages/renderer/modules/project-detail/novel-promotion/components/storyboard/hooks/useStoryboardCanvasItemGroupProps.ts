'use client'

import { useMemo, type ComponentProps } from 'react'
import StoryboardGroup from '../StoryboardGroup'
import type { StoryboardCanvasItemProps } from '../StoryboardCanvasItem.types'

interface UseStoryboardCanvasItemGroupPropsParams
  extends Pick<StoryboardCanvasItemProps, 'storyboard' | 'sbIndex' | 'canvas'> {
  clip: ComponentProps<typeof StoryboardGroup>['clip']
  textPanels: ComponentProps<typeof StoryboardGroup>['textPanels']
  isSubmittingStoryboardTask: boolean
  isSelectingCandidate: boolean
  isSubmittingStoryboardTextTask: boolean
  hasAnyImage: boolean
  failedError: string | null
}

export function useStoryboardCanvasItemGroupProps({
  storyboard,
  sbIndex,
  canvas,
  clip,
  textPanels,
  isSubmittingStoryboardTask,
  isSelectingCandidate,
  isSubmittingStoryboardTextTask,
  hasAnyImage,
  failedError,
}: UseStoryboardCanvasItemGroupPropsParams) {
  return useMemo(
    () =>
      ({
        storyboard,
        clip,
        sbIndex,
        totalStoryboards: canvas.sortedStoryboards.length,
        textPanels,
        storyboardStartIndex: canvas.storyboardStartIndex[storyboard.id],
        videoRatio: canvas.videoRatio,
        isExpanded: canvas.expandedClips.has(storyboard.id),
        isSubmittingStoryboardTask,
        isSelectingCandidate,
        isSubmittingStoryboardTextTask,
        hasAnyImage,
        failedError,
        savingPanels: canvas.savingPanels,
        deletingPanelIds: canvas.deletingPanelIds,
        saveStateByPanel: canvas.saveStateByPanel,
        hasUnsavedByPanel: canvas.hasUnsavedByPanel,
        modifyingPanels: canvas.modifyingPanels,
        submittingPanelImageIds: canvas.submittingPanelImageIds,
        onToggleExpand: () => canvas.onToggleExpandedClip(storyboard.id),
        onMoveUp: () => canvas.onMoveStoryboardGroup(storyboard.clipId, 'up'),
        onMoveDown: () => canvas.onMoveStoryboardGroup(storyboard.clipId, 'down'),
        onRegenerateText: () => canvas.onRegenerateStoryboardText(storyboard.id),
        onAddPanel: () => canvas.onAddPanel(storyboard.id),
        onDeleteStoryboard: () =>
          canvas.onDeleteStoryboard(storyboard.id, textPanels.length),
        onGenerateAllIndividually: () =>
          canvas.onGenerateAllIndividually(storyboard.id),
        onPreviewImage: canvas.onPreviewImage,
        onCloseError: () => canvas.onCloseStoryboardError(storyboard.id),
        getPanelEditData: canvas.getPanelEditData,
        onPanelUpdate: canvas.onPanelUpdate,
        onPanelDelete: (panelId: string) =>
          canvas.onPanelDelete(panelId, storyboard.id, canvas.setLocalStoryboards),
        onOpenCharacterPicker: canvas.onOpenCharacterPicker,
        onOpenLocationPicker: canvas.onOpenLocationPicker,
        onRemoveCharacter: (panel, index) =>
          canvas.onRemoveCharacter(panel, index, storyboard.id),
        onRemoveLocation: (panel) =>
          canvas.onRemoveLocation(panel, storyboard.id),
        onRetryPanelSave: canvas.onRetryPanelSave,
        onRegeneratePanelImage: canvas.onRegeneratePanelImage,
        onOpenEditModal: (panelIndex: number) =>
          canvas.onOpenEditModal(storyboard.id, panelIndex),
        onOpenAIDataModal: (panelIndex: number) =>
          canvas.onOpenAIDataModal(storyboard.id, panelIndex),
        getPanelCandidates: canvas.getPanelCandidates,
        onSelectPanelCandidateIndex: canvas.onSelectPanelCandidateIndex,
        onConfirmPanelCandidate: canvas.onConfirmPanelCandidate,
        onCancelPanelCandidate: canvas.onCancelPanelCandidate,
        formatClipTitle: canvas.formatClipTitle,
        movingClipId: canvas.movingClipId,
        onInsertPanel: canvas.onInsertPanel,
        insertingAfterPanelId: canvas.insertingAfterPanelId,
        projectId: canvas.projectId,
        episodeId: canvas.episodeId,
        onPanelVariant: canvas.onPanelVariant,
        submittingVariantPanelId: canvas.submittingVariantPanelId,
      }) satisfies ComponentProps<typeof StoryboardGroup>,
    [
      canvas,
      clip,
      failedError,
      hasAnyImage,
      isSelectingCandidate,
      isSubmittingStoryboardTask,
      isSubmittingStoryboardTextTask,
      sbIndex,
      storyboard,
      textPanels,
    ],
  )
}
