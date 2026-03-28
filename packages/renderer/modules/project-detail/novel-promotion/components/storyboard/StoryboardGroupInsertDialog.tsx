'use client'

import InsertPanelModal from './InsertPanelModal'
import type { StoryboardGroupDialogsProps } from './StoryboardGroupDialogs.types'

type StoryboardGroupInsertDialogProps = Pick<
  StoryboardGroupDialogsProps,
  | 'insertAfterPanel'
  | 'nextPanelForInsert'
  | 'insertModalOpen'
  | 'insertDialogLabels'
  | 'insertingAfterPanelId'
  | 'onCloseInsertModal'
  | 'onInsert'
>

export default function StoryboardGroupInsertDialog({
  insertAfterPanel,
  nextPanelForInsert,
  insertModalOpen,
  insertDialogLabels,
  insertingAfterPanelId,
  onCloseInsertModal,
  onInsert,
}: StoryboardGroupInsertDialogProps) {
  if (!insertAfterPanel) {
    return null
  }

  return (
    <InsertPanelModal
      isOpen={insertModalOpen}
      onClose={onCloseInsertModal}
      prevPanel={insertAfterPanel}
      nextPanel={nextPanelForInsert}
      labels={insertDialogLabels}
      onInsert={onInsert}
      isInserting={insertingAfterPanelId === insertAfterPanel.id}
    />
  )
}
