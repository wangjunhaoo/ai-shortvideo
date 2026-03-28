'use client'

import PanelVariantModal from './PanelVariantModal'
import type { StoryboardGroupDialogsProps } from './StoryboardGroupDialogs.types'

type StoryboardGroupVariantDialogProps = Pick<
  StoryboardGroupDialogsProps,
  | 'variantModalPanel'
  | 'projectId'
  | 'variantDialogLabels'
  | 'variantDialogMessages'
  | 'submittingVariantPanelId'
  | 'onCloseVariantModal'
  | 'onVariant'
>

export default function StoryboardGroupVariantDialog({
  variantModalPanel,
  projectId,
  variantDialogLabels,
  variantDialogMessages,
  submittingVariantPanelId,
  onCloseVariantModal,
  onVariant,
}: StoryboardGroupVariantDialogProps) {
  if (!variantModalPanel) {
    return null
  }

  return (
    <PanelVariantModal
      isOpen={!!variantModalPanel}
      onClose={onCloseVariantModal}
      panel={variantModalPanel}
      projectId={projectId}
      labels={variantDialogLabels}
      messages={variantDialogMessages}
      onVariant={onVariant}
      isSubmittingVariantTask={submittingVariantPanelId === variantModalPanel.id}
    />
  )
}
