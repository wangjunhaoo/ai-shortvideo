import type { CharacterProfileData } from '@/types/character-profile'
import type { GlobalCopyTarget } from './hooks/useAssetsCopyFromHub'

export interface EditingAppearanceState {
  characterId: string
  characterName: string
  appearanceId: string
  description: string
  descriptionIndex?: number
  introduction?: string | null
}

export interface EditingLocationState {
  locationId: string
  locationName: string
  description: string
}

export interface LocationImageEditModalState {
  locationName: string
}

export interface CharacterImageEditModalState {
  characterName: string
}

export interface VoiceDesignCharacterState {
  name: string
  hasExistingVoice: boolean
}

export interface EditingProfileState {
  characterId: string
  characterName: string
  profileData: CharacterProfileData
}

export type { CharacterProfileData, GlobalCopyTarget }
