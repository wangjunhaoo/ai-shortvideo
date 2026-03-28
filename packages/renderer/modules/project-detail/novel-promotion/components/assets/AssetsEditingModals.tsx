import ImagePreviewModal from '@/components/ui/ImagePreviewModal'
import {
  CharacterCreationModal,
  CharacterEditModal,
  LocationCreationModal,
  LocationEditModal,
} from '@/components/shared/assets'
import ImageEditModal from './ImageEditModal'
import type { ImageEditModalLabels } from './ImageEditModal'
import type {
  CharacterImageEditModalState,
  EditingAppearanceState,
  EditingLocationState,
  LocationImageEditModalState,
} from './AssetsStageModalTypes'

interface AssetsEditingModalsProps {
  projectId: string
  onRefresh: () => void
  onClosePreview: () => void
  handleGenerateImage: (type: 'character' | 'location', id: string, appearanceId?: string) => Promise<void>
  handleUpdateAppearanceDescription: (newDescription: string) => Promise<void>
  handleUpdateLocationDescription: (newDescription: string) => Promise<void>
  handleLocationImageEdit: (modifyPrompt: string, extraImageUrls?: string[]) => Promise<void>
  handleCharacterImageEdit: (modifyPrompt: string, extraImageUrls?: string[]) => Promise<void>
  closeEditingAppearance: () => void
  closeEditingLocation: () => void
  closeAddCharacter: () => void
  closeAddLocation: () => void
  closeImageEditModal: () => void
  closeCharacterImageEditModal: () => void
  previewImage: string | null
  imageEditModal: LocationImageEditModalState | null
  characterImageEditModal: CharacterImageEditModalState | null
  editingAppearance: EditingAppearanceState | null
  editingLocation: EditingLocationState | null
  showAddCharacter: boolean
  showAddLocation: boolean
  getImageEditModalLabels: (type: 'character' | 'location', name: string) => ImageEditModalLabels
}

export function AssetsEditingModals({
  projectId,
  onRefresh,
  onClosePreview,
  handleGenerateImage,
  handleUpdateAppearanceDescription,
  handleUpdateLocationDescription,
  handleLocationImageEdit,
  handleCharacterImageEdit,
  closeEditingAppearance,
  closeEditingLocation,
  closeAddCharacter,
  closeAddLocation,
  closeImageEditModal,
  closeCharacterImageEditModal,
  previewImage,
  imageEditModal,
  characterImageEditModal,
  editingAppearance,
  editingLocation,
  showAddCharacter,
  showAddLocation,
  getImageEditModalLabels,
}: AssetsEditingModalsProps) {
  return (
    <>
      {previewImage && <ImagePreviewModal imageUrl={previewImage} onClose={onClosePreview} />}

      {imageEditModal && (
        <ImageEditModal
          type="location"
          name={imageEditModal.locationName}
          onClose={closeImageEditModal}
          onConfirm={handleLocationImageEdit}
          labels={getImageEditModalLabels('location', imageEditModal.locationName)}
        />
      )}

      {characterImageEditModal && (
        <ImageEditModal
          type="character"
          name={characterImageEditModal.characterName}
          onClose={closeCharacterImageEditModal}
          onConfirm={handleCharacterImageEdit}
          labels={getImageEditModalLabels('character', characterImageEditModal.characterName)}
        />
      )}

      {editingAppearance && (
        <CharacterEditModal
          mode="project"
          characterId={editingAppearance.characterId}
          characterName={editingAppearance.characterName}
          appearanceId={editingAppearance.appearanceId}
          description={editingAppearance.description}
          descriptionIndex={editingAppearance.descriptionIndex}
          introduction={editingAppearance.introduction}
          projectId={projectId}
          onClose={closeEditingAppearance}
          onSave={(characterId, appearanceId) => void handleGenerateImage('character', characterId, appearanceId)}
          onUpdate={handleUpdateAppearanceDescription}
        />
      )}

      {editingLocation && (
        <LocationEditModal
          mode="project"
          locationId={editingLocation.locationId}
          locationName={editingLocation.locationName}
          description={editingLocation.description}
          projectId={projectId}
          onClose={closeEditingLocation}
          onSave={(locationId) => void handleGenerateImage('location', locationId)}
          onUpdate={handleUpdateLocationDescription}
        />
      )}

      {showAddCharacter && (
        <CharacterCreationModal
          mode="project"
          projectId={projectId}
          onClose={closeAddCharacter}
          onSuccess={() => {
            closeAddCharacter()
            onRefresh()
          }}
        />
      )}

      {showAddLocation && (
        <LocationCreationModal
          mode="project"
          projectId={projectId}
          onClose={closeAddLocation}
          onSuccess={() => {
            closeAddLocation()
            onRefresh()
          }}
        />
      )}
    </>
  )
}
