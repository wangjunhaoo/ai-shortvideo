'use client'

import PanelEditForm from '../PanelEditForm'
import type { PanelCardProps } from './PanelCard.types'

type PanelCardEditorSectionProps = Pick<
  PanelCardProps,
  | 'panelData'
  | 'isSaving'
  | 'hasUnsavedChanges'
  | 'saveErrorMessage'
  | 'onRetrySave'
  | 'onUpdate'
  | 'onOpenCharacterPicker'
  | 'onOpenLocationPicker'
  | 'onRemoveCharacter'
  | 'onRemoveLocation'
>

export default function PanelCardEditorSection({
  panelData,
  isSaving,
  hasUnsavedChanges = false,
  saveErrorMessage = null,
  onRetrySave,
  onUpdate,
  onOpenCharacterPicker,
  onOpenLocationPicker,
  onRemoveCharacter,
  onRemoveLocation,
}: PanelCardEditorSectionProps) {
  return (
    <div className="p-3">
      <PanelEditForm
        panelData={panelData}
        isSaving={isSaving}
        saveStatus={hasUnsavedChanges ? 'error' : isSaving ? 'saving' : 'idle'}
        saveErrorMessage={saveErrorMessage}
        onRetrySave={onRetrySave}
        onUpdate={onUpdate}
        onOpenCharacterPicker={onOpenCharacterPicker}
        onOpenLocationPicker={onOpenLocationPicker}
        onRemoveCharacter={onRemoveCharacter}
        onRemoveLocation={onRemoveLocation}
      />
    </div>
  )
}
