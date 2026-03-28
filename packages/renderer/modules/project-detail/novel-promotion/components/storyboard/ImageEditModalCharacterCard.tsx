'use client'

import { toDisplayImageUrl } from '@/lib/media/image-url'
import { MediaImageWithLoading } from '@/components/media/MediaImageWithLoading'
import { AppIcon } from '@/components/ui/icons'
import type { ImageEditModalCharacterCardProps } from './ImageEditModal.types'

export default function ImageEditModalCharacterCard({
  character,
  appearance,
  isSelected,
  displayName,
  onAddAsset,
  onRemoveAsset,
  onPreviewImage,
}: ImageEditModalCharacterCardProps) {
  const displayImageUrl = toDisplayImageUrl(appearance.imageUrl)

  return (
    <button
      onClick={() => {
        if (isSelected) {
          onRemoveAsset(character.id, 'character')
        } else {
          onAddAsset({
            id: character.id,
            name: displayName,
            type: 'character',
            imageUrl: appearance.imageUrl,
            appearanceId: appearance.appearanceIndex,
            appearanceName: appearance.changeReason,
          })
        }
      }}
      className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
        isSelected
          ? 'border-[var(--glass-stroke-focus)]'
          : 'border-transparent'
      }`}
    >
      {displayImageUrl ? (
        <MediaImageWithLoading
          src={displayImageUrl}
          alt={displayName}
          containerClassName="w-full h-full"
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={(event) => {
            event.stopPropagation()
            onPreviewImage(appearance.imageUrl || null)
          }}
        />
      ) : (
        <div className="w-full h-full bg-[var(--glass-bg-muted)] flex items-center justify-center text-[var(--glass-text-tertiary)]">
          <AppIcon name="user" className="h-7 w-7" />
        </div>
      )}
      <div
        className="absolute bottom-0 left-0 right-0 bg-[var(--glass-overlay)] text-white text-xs p-1 truncate"
        title={displayName}
      >
        {displayName}
      </div>
      {isSelected && (
        <div className="absolute top-1 right-1 w-5 h-5 bg-[var(--glass-accent-from)] text-white rounded-full flex items-center justify-center">
          <AppIcon name="checkXs" className="h-3 w-3" />
        </div>
      )}
    </button>
  )
}
