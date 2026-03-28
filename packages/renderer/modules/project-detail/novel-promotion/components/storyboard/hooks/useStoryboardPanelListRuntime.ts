'use client'

import { ASPECT_RATIO_CONFIGS } from '@/lib/constants'
import type {
  StoryboardPanelListItemProps,
  StoryboardPanelListProps,
} from '../StoryboardPanelList.types'
import { useStoryboardPanelListItems } from './useStoryboardPanelListItems'

export function useStoryboardPanelListRuntime({
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
}: StoryboardPanelListProps) {
  const isVertical = ASPECT_RATIO_CONFIGS[videoRatio]?.isVertical ?? false
  const panelItems = useStoryboardPanelListItems({
    textPanels,
    storyboardStartIndex,
    savingPanels,
    deletingPanelIds,
    saveStateByPanel,
    hasUnsavedByPanel,
    modifyingPanels,
    panelTaskErrorMap,
    isPanelTaskRunning,
    getPanelEditData,
    getPanelCandidates,
  })

  const itemBridgeProps: Omit<StoryboardPanelListItemProps, 'item'> = {
    storyboardId,
    panelCardLabels,
    videoRatio,
    totalPanels: textPanels.length,
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
  }

  const containerClassName = `grid gap-4 ${
    isVertical ? 'grid-cols-5' : 'grid-cols-3'
  } ${isSubmittingStoryboardTextTask ? 'opacity-50 pointer-events-none' : ''}`

  return {
    panelItems,
    itemBridgeProps,
    containerClassName,
  }
}
