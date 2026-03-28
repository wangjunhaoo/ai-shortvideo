'use client'

import PanelCard from './PanelCard'
import { useStoryboardPanelListItemCardProps } from './hooks/useStoryboardPanelListItemCardProps'
import type { StoryboardPanelListItemProps } from './StoryboardPanelList.types'

export default function StoryboardPanelListItem({
  storyboardId,
  panelCardLabels,
  videoRatio,
  totalPanels,
  item,
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
}: StoryboardPanelListItemProps) {
  const cardProps = useStoryboardPanelListItemCardProps({
    storyboardId,
    panelCardLabels,
    videoRatio,
    item,
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
    <div
      className="relative group/panel h-full"
      style={{ zIndex: totalPanels - item.index }}
    >
      <PanelCard {...cardProps} />
    </div>
  )
}
