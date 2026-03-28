'use client'

import { useMemo, type ComponentProps } from 'react'
import StoryboardGroupChrome from '../StoryboardGroupChrome'
import StoryboardGroupDialogs from '../StoryboardGroupDialogs'
import type { PanelCardLabels } from '../PanelCard.types'
import type { InsertPanelModalLabels } from '../InsertPanelModal.types'
import type {
  PanelVariantModalProps,
  PanelVariantModalStateMessages,
} from '../PanelVariantModal.types'
import StoryboardPanelList from '../StoryboardPanelList'
import type { StoryboardGroupProps } from '../StoryboardGroup.types'
import type { useStoryboardGroupViewState } from './useStoryboardGroupViewState'
import type { useStoryboardInsertVariantRuntime } from './useStoryboardInsertVariantRuntime'

type StoryboardInsertVariantRuntime = ReturnType<
  typeof useStoryboardInsertVariantRuntime
>
type StoryboardGroupViewState = Pick<
  ReturnType<typeof useStoryboardGroupViewState>,
  | 'isPanelTaskRunning'
  | 'currentRunningCount'
  | 'pendingCount'
  | 'groupOverlayState'
  | 'handleRegeneratePanelImage'
>

interface UseStoryboardGroupSectionPropsParams {
  props: StoryboardGroupProps
  chromeLabels: ComponentProps<typeof StoryboardGroupChrome>['labels']
  dialogLabels: {
    insertDialogLabels: InsertPanelModalLabels
    variantDialogLabels: PanelVariantModalProps['labels']
    variantDialogMessages: PanelVariantModalStateMessages
  }
  panelCardLabels: PanelCardLabels
  insertVariantRuntime: StoryboardInsertVariantRuntime
  viewState: StoryboardGroupViewState
  panelTaskErrorMap: Map<string, { taskId: string; message: string }>
  clearPanelTaskError: (panelId: string) => void
}

export function useStoryboardGroupSectionProps({
  props,
  chromeLabels,
  dialogLabels,
  panelCardLabels,
  insertVariantRuntime,
  viewState,
  panelTaskErrorMap,
  clearPanelTaskError,
}: UseStoryboardGroupSectionPropsParams) {
  const chromeProps = useMemo(
    () =>
      ({
        labels: chromeLabels,
        failedError: props.failedError,
        isSubmittingStoryboardTask: props.isSubmittingStoryboardTask,
        isSelectingCandidate: props.isSelectingCandidate,
        groupOverlayState: viewState.groupOverlayState,
        clip: props.clip,
        sbIndex: props.sbIndex,
        totalStoryboards: props.totalStoryboards,
        movingClipId: props.movingClipId,
        storyboardClipId: props.storyboard.clipId,
        formatClipTitle: props.formatClipTitle,
        onMoveUp: props.onMoveUp,
        onMoveDown: props.onMoveDown,
        hasAnyImage: props.hasAnyImage,
        isSubmittingStoryboardTextTask: props.isSubmittingStoryboardTextTask,
        currentRunningCount: viewState.currentRunningCount,
        pendingCount: viewState.pendingCount,
        onRegenerateText: props.onRegenerateText,
        onGenerateAllIndividually: props.onGenerateAllIndividually,
        onAddPanel: props.onAddPanel,
        onDeleteStoryboard: props.onDeleteStoryboard,
        onCloseError: props.onCloseError,
      } satisfies ComponentProps<typeof StoryboardGroupChrome>),
    [
      chromeLabels,
      props.clip,
      props.failedError,
      props.formatClipTitle,
      props.hasAnyImage,
      props.isSelectingCandidate,
      props.isSubmittingStoryboardTask,
      props.isSubmittingStoryboardTextTask,
      props.movingClipId,
      props.onAddPanel,
      props.onCloseError,
      props.onDeleteStoryboard,
      props.onGenerateAllIndividually,
      props.onMoveDown,
      props.onMoveUp,
      props.onRegenerateText,
      props.sbIndex,
      props.storyboard.clipId,
      props.totalStoryboards,
      viewState.currentRunningCount,
      viewState.groupOverlayState,
      viewState.pendingCount,
    ],
  )

  const panelListProps = useMemo(
    () =>
      ({
        storyboardId: props.storyboard.id,
        panelCardLabels,
        textPanels: props.textPanels,
        storyboardStartIndex: props.storyboardStartIndex,
        videoRatio: props.videoRatio,
        isSubmittingStoryboardTextTask: props.isSubmittingStoryboardTextTask,
        savingPanels: props.savingPanels,
        deletingPanelIds: props.deletingPanelIds,
        saveStateByPanel: props.saveStateByPanel,
        hasUnsavedByPanel: props.hasUnsavedByPanel,
        modifyingPanels: props.modifyingPanels,
        panelTaskErrorMap,
        isPanelTaskRunning: viewState.isPanelTaskRunning,
        getPanelEditData: props.getPanelEditData,
        getPanelCandidates: props.getPanelCandidates,
        onPanelUpdate: props.onPanelUpdate,
        onPanelDelete: props.onPanelDelete,
        onOpenCharacterPicker: props.onOpenCharacterPicker,
        onOpenLocationPicker: props.onOpenLocationPicker,
        onRemoveCharacter: props.onRemoveCharacter,
        onRemoveLocation: props.onRemoveLocation,
        onRetryPanelSave: props.onRetryPanelSave,
        onRegeneratePanelImage: viewState.handleRegeneratePanelImage,
        onOpenEditModal: props.onOpenEditModal,
        onOpenAIDataModal: props.onOpenAIDataModal,
        onSelectPanelCandidateIndex: props.onSelectPanelCandidateIndex,
        onConfirmPanelCandidate: props.onConfirmPanelCandidate,
        onCancelPanelCandidate: props.onCancelPanelCandidate,
        onClearPanelTaskError: clearPanelTaskError,
        onPreviewImage: props.onPreviewImage,
        onInsertAfter: insertVariantRuntime.handleOpenInsertModal,
        onVariant: insertVariantRuntime.handleOpenVariantModal,
        isInsertDisabled: (panelId: string) =>
          props.isSubmittingStoryboardTextTask ||
          props.insertingAfterPanelId === panelId ||
          props.submittingVariantPanelId === panelId,
      } satisfies ComponentProps<typeof StoryboardPanelList>),
    [
      clearPanelTaskError,
      insertVariantRuntime.handleOpenInsertModal,
      insertVariantRuntime.handleOpenVariantModal,
      panelTaskErrorMap,
      panelCardLabels,
      props.deletingPanelIds,
      props.getPanelCandidates,
      props.getPanelEditData,
      props.hasUnsavedByPanel,
      props.insertingAfterPanelId,
      props.isSubmittingStoryboardTextTask,
      props.modifyingPanels,
      props.onCancelPanelCandidate,
      props.onConfirmPanelCandidate,
      props.onOpenAIDataModal,
      props.onOpenCharacterPicker,
      props.onOpenEditModal,
      props.onOpenLocationPicker,
      props.onPanelDelete,
      props.onPanelUpdate,
      props.onPreviewImage,
      props.onRemoveCharacter,
      props.onRemoveLocation,
      props.onRetryPanelSave,
      props.onSelectPanelCandidateIndex,
      props.saveStateByPanel,
      props.savingPanels,
      props.storyboard.id,
      props.storyboardStartIndex,
      props.submittingVariantPanelId,
      props.textPanels,
      props.videoRatio,
      viewState.handleRegeneratePanelImage,
      viewState.isPanelTaskRunning,
    ],
  )

  const dialogsProps = useMemo(
    () =>
      ({
        insertAfterPanel: insertVariantRuntime.insertAfterPanel,
        nextPanelForInsert: insertVariantRuntime.nextPanelForInsert,
        insertModalOpen: insertVariantRuntime.insertModalOpen,
        insertDialogLabels: dialogLabels.insertDialogLabels,
        insertingAfterPanelId: props.insertingAfterPanelId,
        onCloseInsertModal: insertVariantRuntime.handleCloseInsertModal,
        onInsert: insertVariantRuntime.handleInsert,
        variantModalPanel: insertVariantRuntime.variantModalPanel,
        projectId: props.projectId,
        variantDialogLabels: dialogLabels.variantDialogLabels,
        variantDialogMessages: dialogLabels.variantDialogMessages,
        submittingVariantPanelId: props.submittingVariantPanelId,
        onCloseVariantModal: insertVariantRuntime.handleCloseVariantModal,
        onVariant: insertVariantRuntime.handleVariant,
      } satisfies ComponentProps<typeof StoryboardGroupDialogs>),
    [
      dialogLabels.insertDialogLabels,
      dialogLabels.variantDialogLabels,
      dialogLabels.variantDialogMessages,
      insertVariantRuntime.handleCloseInsertModal,
      insertVariantRuntime.handleCloseVariantModal,
      insertVariantRuntime.handleInsert,
      insertVariantRuntime.handleVariant,
      insertVariantRuntime.insertAfterPanel,
      insertVariantRuntime.insertModalOpen,
      insertVariantRuntime.nextPanelForInsert,
      insertVariantRuntime.variantModalPanel,
      props.insertingAfterPanelId,
      props.projectId,
      props.submittingVariantPanelId,
    ],
  )

  return {
    chromeProps,
    panelListProps,
    dialogsProps,
  }
}
