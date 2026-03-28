'use client'

import StoryboardStageAssetPickers from './StoryboardStageAssetPickers'
import StoryboardStagePrimaryModals from './StoryboardStagePrimaryModals'
import type { StoryboardStageModalsProps } from './StoryboardStageModals.types'

export default function StoryboardStageModals({
  projectId,
  modalRuntime,
  getPanelEditData,
  primaryLabels,
  assetPickerLabels,
}: StoryboardStageModalsProps) {
  return (
    <>
      <StoryboardStagePrimaryModals
        modalRuntime={modalRuntime}
        labels={primaryLabels}
      />

      <StoryboardStageAssetPickers
        projectId={projectId}
        modalRuntime={modalRuntime}
        getPanelEditData={getPanelEditData}
        labels={assetPickerLabels}
      />
    </>
  )
}
