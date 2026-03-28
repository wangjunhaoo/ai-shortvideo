'use client'

import type { CharacterProfileData } from '@/types/character-profile'
import { AssetsEditingModals } from './AssetsEditingModals'
import type { ImageEditModalLabels } from './ImageEditModal'
import type {
  CharacterImageEditModalState,
  EditingAppearanceState,
  EditingLocationState,
  EditingProfileState,
  GlobalCopyTarget,
  LocationImageEditModalState,
  VoiceDesignCharacterState,
} from './AssetsStageModalTypes'
import { AssetsSupportModals } from './AssetsSupportModals'
import type { AssetsSupportModalsLabels } from './AssetsSupportModals'

interface AssetsStageModalsProps {
  projectId: string
  onRefresh: () => void
  onClosePreview: () => void
  handleGenerateImage: (type: 'character' | 'location', id: string, appearanceId?: string) => Promise<void>
  handleUpdateAppearanceDescription: (newDescription: string) => Promise<void>
  handleUpdateLocationDescription: (newDescription: string) => Promise<void>
  handleLocationImageEdit: (modifyPrompt: string, extraImageUrls?: string[]) => Promise<void>
  handleCharacterImageEdit: (modifyPrompt: string, extraImageUrls?: string[]) => Promise<void>
  handleCloseVoiceDesign: () => void
  handleVoiceDesignSave: (voiceId: string, audioBase64: string) => Promise<void>
  handleCloseCopyPicker: () => void
  handleConfirmCopyFromGlobal: (globalAssetId: string) => Promise<void>
  handleConfirmProfile: (characterId: string, updatedProfileData?: CharacterProfileData) => Promise<void>
  closeEditingAppearance: () => void
  closeEditingLocation: () => void
  closeAddCharacter: () => void
  closeAddLocation: () => void
  closeImageEditModal: () => void
  closeCharacterImageEditModal: () => void
  isConfirmingCharacter: (characterId: string) => boolean
  setEditingProfile: (value: EditingProfileState | null) => void
  previewImage: string | null
  imageEditModal: LocationImageEditModalState | null
  characterImageEditModal: CharacterImageEditModalState | null
  editingAppearance: EditingAppearanceState | null
  editingLocation: EditingLocationState | null
  showAddCharacter: boolean
  showAddLocation: boolean
  voiceDesignCharacter: VoiceDesignCharacterState | null
  editingProfile: EditingProfileState | null
  copyFromGlobalTarget: GlobalCopyTarget | null
  isGlobalCopyInFlight: boolean
  supportLabels: AssetsSupportModalsLabels
  getImageEditModalLabels: (type: 'character' | 'location', name: string) => ImageEditModalLabels
}

export default function AssetsStageModals({
  projectId,
  onRefresh,
  onClosePreview,
  handleGenerateImage,
  handleUpdateAppearanceDescription,
  handleUpdateLocationDescription,
  handleLocationImageEdit,
  handleCharacterImageEdit,
  handleCloseVoiceDesign,
  handleVoiceDesignSave,
  handleCloseCopyPicker,
  handleConfirmCopyFromGlobal,
  handleConfirmProfile,
  closeEditingAppearance,
  closeEditingLocation,
  closeAddCharacter,
  closeAddLocation,
  closeImageEditModal,
  closeCharacterImageEditModal,
  isConfirmingCharacter,
  setEditingProfile,
  previewImage,
  imageEditModal,
  characterImageEditModal,
  editingAppearance,
  editingLocation,
  showAddCharacter,
  showAddLocation,
  voiceDesignCharacter,
  editingProfile,
  copyFromGlobalTarget,
  isGlobalCopyInFlight,
  supportLabels,
  getImageEditModalLabels,
}: AssetsStageModalsProps) {
  return (
    <>
      <AssetsEditingModals
        projectId={projectId}
        onRefresh={onRefresh}
        onClosePreview={onClosePreview}
        handleGenerateImage={handleGenerateImage}
        handleUpdateAppearanceDescription={handleUpdateAppearanceDescription}
        handleUpdateLocationDescription={handleUpdateLocationDescription}
        handleLocationImageEdit={handleLocationImageEdit}
        handleCharacterImageEdit={handleCharacterImageEdit}
        closeEditingAppearance={closeEditingAppearance}
        closeEditingLocation={closeEditingLocation}
        closeAddCharacter={closeAddCharacter}
        closeAddLocation={closeAddLocation}
        closeImageEditModal={closeImageEditModal}
        closeCharacterImageEditModal={closeCharacterImageEditModal}
        previewImage={previewImage}
        imageEditModal={imageEditModal}
        characterImageEditModal={characterImageEditModal}
        editingAppearance={editingAppearance}
        editingLocation={editingLocation}
        showAddCharacter={showAddCharacter}
        showAddLocation={showAddLocation}
        getImageEditModalLabels={getImageEditModalLabels}
      />
      <AssetsSupportModals
        projectId={projectId}
        handleCloseVoiceDesign={handleCloseVoiceDesign}
        handleVoiceDesignSave={handleVoiceDesignSave}
        handleCloseCopyPicker={handleCloseCopyPicker}
        handleConfirmCopyFromGlobal={handleConfirmCopyFromGlobal}
        handleConfirmProfile={handleConfirmProfile}
        isConfirmingCharacter={isConfirmingCharacter}
        setEditingProfile={setEditingProfile}
        voiceDesignCharacter={voiceDesignCharacter}
        editingProfile={editingProfile}
        copyFromGlobalTarget={copyFromGlobalTarget}
        isGlobalCopyInFlight={isGlobalCopyInFlight}
        labels={supportLabels}
      />
    </>
  )
}
