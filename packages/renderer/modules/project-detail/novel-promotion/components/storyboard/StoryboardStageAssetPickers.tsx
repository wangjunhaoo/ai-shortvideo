'use client'

import { CharacterPickerModal, LocationPickerModal } from '../PanelEditForm'
import type {
  StoryboardStageAssetPickerLabels,
  StoryboardModalRuntime,
  StoryboardStageController,
} from './StoryboardStageModals.types'

interface StoryboardStageAssetPickersProps {
  projectId: string
  modalRuntime: StoryboardModalRuntime
  getPanelEditData: StoryboardStageController['getPanelEditData']
  labels: StoryboardStageAssetPickerLabels
}

export default function StoryboardStageAssetPickers({
  projectId,
  modalRuntime,
  getPanelEditData,
  labels,
}: StoryboardStageAssetPickersProps) {
  return (
    <>
      {modalRuntime.hasCharacterPicker ? (
        <CharacterPickerModal
          projectId={projectId}
          currentCharacters={
            modalRuntime.pickerPanelRuntime
              ? getPanelEditData(modalRuntime.pickerPanelRuntime.panel).characters
              : []
          }
          onSelect={modalRuntime.handleAddCharacter}
          onClose={modalRuntime.closeAssetPicker}
          labels={labels.character}
        />
      ) : null}

      {modalRuntime.hasLocationPicker ? (
        <LocationPickerModal
          projectId={projectId}
          currentLocation={
            modalRuntime.pickerPanelRuntime
              ? getPanelEditData(modalRuntime.pickerPanelRuntime.panel).location ||
                null
              : null
          }
          onSelect={modalRuntime.handleSetLocation}
          onClose={modalRuntime.closeAssetPicker}
          labels={labels.location}
        />
      ) : null}
    </>
  )
}
