import GlobalAssetPicker from '@/components/shared/assets/GlobalAssetPicker'
import CharacterProfileDialog from './CharacterProfileDialog'
import type { CharacterProfileDialogLabels } from './CharacterProfileDialog'
import VoiceDesignDialog from '../voice/VoiceDesignDialog'
import type {
  EditingProfileState,
  GlobalCopyTarget,
  VoiceDesignCharacterState,
} from './AssetsStageModalTypes'
import type { CharacterProfileData } from '@/types/character-profile'

export interface AssetsSupportModalsLabels {
  profileDialog: CharacterProfileDialogLabels
}

interface AssetsSupportModalsProps {
  projectId: string
  handleCloseVoiceDesign: () => void
  handleVoiceDesignSave: (voiceId: string, audioBase64: string) => Promise<void>
  handleCloseCopyPicker: () => void
  handleConfirmCopyFromGlobal: (globalAssetId: string) => Promise<void>
  handleConfirmProfile: (characterId: string, updatedProfileData?: CharacterProfileData) => Promise<void>
  isConfirmingCharacter: (characterId: string) => boolean
  setEditingProfile: (value: EditingProfileState | null) => void
  voiceDesignCharacter: VoiceDesignCharacterState | null
  editingProfile: EditingProfileState | null
  copyFromGlobalTarget: GlobalCopyTarget | null
  isGlobalCopyInFlight: boolean
  labels: AssetsSupportModalsLabels
}

export function AssetsSupportModals({
  projectId,
  handleCloseVoiceDesign,
  handleVoiceDesignSave,
  handleCloseCopyPicker,
  handleConfirmCopyFromGlobal,
  handleConfirmProfile,
  isConfirmingCharacter,
  setEditingProfile,
  voiceDesignCharacter,
  editingProfile,
  copyFromGlobalTarget,
  isGlobalCopyInFlight,
  labels,
}: AssetsSupportModalsProps) {
  return (
    <>
      {voiceDesignCharacter && (
        <VoiceDesignDialog
          isOpen={!!voiceDesignCharacter}
          speaker={voiceDesignCharacter.name}
          hasExistingVoice={voiceDesignCharacter.hasExistingVoice}
          projectId={projectId}
          onClose={handleCloseVoiceDesign}
          onSave={handleVoiceDesignSave}
        />
      )}

      {editingProfile && (
        <CharacterProfileDialog
          isOpen={!!editingProfile}
          characterName={editingProfile.characterName}
          profileData={editingProfile.profileData}
          onClose={() => setEditingProfile(null)}
          onSave={(profileData) => handleConfirmProfile(editingProfile.characterId, profileData)}
          isSaving={isConfirmingCharacter(editingProfile.characterId)}
          labels={labels.profileDialog}
        />
      )}

      {copyFromGlobalTarget && (
        <GlobalAssetPicker
          isOpen={!!copyFromGlobalTarget}
          onClose={handleCloseCopyPicker}
          onSelect={handleConfirmCopyFromGlobal}
          type={copyFromGlobalTarget.type}
          loading={isGlobalCopyInFlight}
        />
      )}
    </>
  )
}
