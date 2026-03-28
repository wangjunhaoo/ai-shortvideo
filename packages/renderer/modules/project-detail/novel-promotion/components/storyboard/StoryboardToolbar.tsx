'use client'

import StoryboardHeader from './StoryboardHeader'
import StoryboardAddGroupButton from './StoryboardAddGroupButton'
import type { StoryboardToolbarProps } from './StoryboardToolbar.types'

export default function StoryboardToolbar({
  totalSegments,
  totalPanels,
  isDownloadingImages,
  runningCount,
  pendingPanelCount,
  isBatchSubmitting,
  addingStoryboardGroup,
  addingStoryboardGroupState,
  labels,
  onDownloadAllImages,
  onGenerateAllPanels,
  onAddStoryboardGroupAtStart,
  onBack,
}: StoryboardToolbarProps) {
  return (
    <>
      <StoryboardHeader
        totalSegments={totalSegments}
        totalPanels={totalPanels}
        isDownloadingImages={isDownloadingImages}
        runningCount={runningCount}
        pendingPanelCount={pendingPanelCount}
        isBatchSubmitting={isBatchSubmitting}
        labels={labels.header}
        onDownloadAllImages={onDownloadAllImages}
        onGenerateAllPanels={onGenerateAllPanels}
        onBack={onBack}
      />

      <div className="flex justify-center">
        <StoryboardAddGroupButton
          label={labels.addGroupAtStartLabel}
          addingStoryboardGroup={addingStoryboardGroup}
          addingStoryboardGroupState={addingStoryboardGroupState}
          onAddStoryboardGroupAtStart={onAddStoryboardGroupAtStart}
        />
      </div>
    </>
  )
}
