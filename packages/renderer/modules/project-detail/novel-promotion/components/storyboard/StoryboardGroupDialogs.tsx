'use client'

import StoryboardGroupInsertDialog from './StoryboardGroupInsertDialog'
import StoryboardGroupVariantDialog from './StoryboardGroupVariantDialog'
import type { StoryboardGroupDialogsProps } from './StoryboardGroupDialogs.types'

export default function StoryboardGroupDialogs({
  insertAfterPanel,
  nextPanelForInsert,
  insertModalOpen,
  insertDialogLabels,
  insertingAfterPanelId,
  onCloseInsertModal,
  onInsert,
  variantModalPanel,
  projectId,
  variantDialogLabels,
  variantDialogMessages,
  submittingVariantPanelId,
  onCloseVariantModal,
  onVariant,
}: StoryboardGroupDialogsProps) {
  return (
    <>
      <StoryboardGroupInsertDialog
        insertAfterPanel={insertAfterPanel}
        nextPanelForInsert={nextPanelForInsert}
        insertModalOpen={insertModalOpen}
        insertDialogLabels={insertDialogLabels}
        insertingAfterPanelId={insertingAfterPanelId}
        onCloseInsertModal={onCloseInsertModal}
        onInsert={onInsert}
      />

      <StoryboardGroupVariantDialog
        variantModalPanel={variantModalPanel}
        projectId={projectId}
        variantDialogLabels={variantDialogLabels}
        variantDialogMessages={variantDialogMessages}
        submittingVariantPanelId={submittingVariantPanelId}
        onCloseVariantModal={onCloseVariantModal}
        onVariant={onVariant}
      />
    </>
  )
}
