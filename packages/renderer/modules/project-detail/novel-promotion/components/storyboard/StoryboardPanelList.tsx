'use client'

import StoryboardPanelListItem from './StoryboardPanelListItem'
import type { StoryboardPanelListProps } from './StoryboardPanelList.types'
import { useStoryboardPanelListRuntime } from './hooks/useStoryboardPanelListRuntime'

export default function StoryboardPanelList({
  storyboardId,
  textPanels,
  panelCardLabels,
  storyboardStartIndex,
  videoRatio,
  isSubmittingStoryboardTextTask,
  savingPanels,
  deletingPanelIds,
  saveStateByPanel,
  hasUnsavedByPanel,
  modifyingPanels,
  panelTaskErrorMap,
  isPanelTaskRunning,
  getPanelEditData,
  getPanelCandidates,
  onPanelUpdate,
  onPanelDelete,
  onOpenCharacterPicker,
  onOpenLocationPicker,
  onRemoveCharacter,
  onRemoveLocation,
  onRetryPanelSave,
  onRegeneratePanelImage,
  onOpenEditModal,
  onOpenAIDataModal,
  onSelectPanelCandidateIndex,
  onConfirmPanelCandidate,
  onCancelPanelCandidate,
  onClearPanelTaskError,
  onPreviewImage,
  onInsertAfter,
  onVariant,
  isInsertDisabled,
}: StoryboardPanelListProps) {
  const {
    panelItems,
    itemBridgeProps,
    containerClassName,
  } = useStoryboardPanelListRuntime({
    textPanels,
    panelCardLabels,
    storyboardStartIndex,
    videoRatio,
    isSubmittingStoryboardTextTask,
    savingPanels,
    deletingPanelIds,
    saveStateByPanel,
    hasUnsavedByPanel,
    modifyingPanels,
    panelTaskErrorMap,
    isPanelTaskRunning,
    getPanelEditData,
    getPanelCandidates,
    storyboardId,
    onPanelUpdate,
    onPanelDelete,
    onOpenCharacterPicker,
    onOpenLocationPicker,
    onRemoveCharacter,
    onRemoveLocation,
    onRetryPanelSave,
    onRegeneratePanelImage,
    onOpenEditModal,
    onOpenAIDataModal,
    onSelectPanelCandidateIndex,
    onConfirmPanelCandidate,
    onCancelPanelCandidate,
    onClearPanelTaskError,
    onPreviewImage,
    onInsertAfter,
    onVariant,
    isInsertDisabled,
  })

  return (
    <div className={containerClassName}>
      {panelItems.map((item) => (
        <StoryboardPanelListItem
          key={item.panel.id || item.index}
          {...itemBridgeProps}
          item={item}
        />
      ))}
    </div>
  )
}
