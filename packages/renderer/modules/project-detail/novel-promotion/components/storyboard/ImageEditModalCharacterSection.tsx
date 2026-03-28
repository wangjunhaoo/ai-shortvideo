'use client'

import { AppIcon } from '@/components/ui/icons'
import ImageEditModalCharacterCard from './ImageEditModalCharacterCard'
import type {
  ImageEditModalAssetPickerLabels,
  ImageEditModalCharacterSectionProps,
} from './ImageEditModal.types'

export default function ImageEditModalCharacterSection({
  labels,
  characters,
  selectedAssets,
  onAddAsset,
  onRemoveAsset,
  onPreviewImage,
}: ImageEditModalCharacterSectionProps) {
  if (characters.length === 0) {
    return null
  }

  return (
    <div className="mb-4">
      <h5 className="text-sm font-medium text-[var(--glass-text-secondary)] mb-2 flex items-center gap-1.5">
        <AppIcon name="user" className="h-4 w-4 text-[var(--glass-text-tertiary)]" />
        <span>{labels.characterLabel}</span>
      </h5>

      <div className="grid grid-cols-4 gap-2">
        {characters.map((character) => {
          const appearances = character.appearances || []
          const hasMultipleAppearances = appearances.length > 1

          return appearances.map((appearance) => {
            const isSelected = selectedAssets.some(
              (asset) =>
                asset.id === character.id &&
                asset.type === 'character' &&
                asset.appearanceId === appearance.appearanceIndex,
            )
            const displayName = hasMultipleAppearances
              ? `${character.name} - ${appearance.changeReason || labels.defaultAppearanceLabel}`
              : character.name

            return (
              <ImageEditModalCharacterCard
                key={`${character.id}-${appearance.appearanceIndex}`}
                character={character}
                appearance={appearance}
                isSelected={isSelected}
                displayName={displayName}
                onAddAsset={onAddAsset}
                onRemoveAsset={onRemoveAsset}
                onPreviewImage={onPreviewImage}
              />
            )
          })
        })}
      </div>
    </div>
  )
}
