'use client'

import { toDisplayImageUrl } from '@/lib/media/image-url'
import { MediaImageWithLoading } from '@/components/media/MediaImageWithLoading'
import { AppIcon } from '@/components/ui/icons'
import type { ImageEditModalLocationCardProps } from './ImageEditModal.types'

export default function ImageEditModalLocationCard({
  location,
  isSelected,
  onAddAsset,
  onRemoveAsset,
  onPreviewImage,
}: ImageEditModalLocationCardProps) {
  const selectedImage = location.selectedImageId
    ? location.images?.find((image) => image.id === location.selectedImageId)
    : location.images?.find((image) => image.isSelected) ||
      location.images?.find((image) => image.imageUrl) ||
      location.images?.[0]
  const imageUrl = selectedImage?.imageUrl
  const displayImageUrl = toDisplayImageUrl(imageUrl || null)

  return (
    <button
      onClick={() => {
        if (isSelected) {
          onRemoveAsset(location.id, 'location')
        } else {
          onAddAsset({
            id: location.id,
            name: location.name,
            type: 'location',
            imageUrl: imageUrl ?? null,
          })
        }
      }}
      className={`relative aspect-[3/2] rounded-lg overflow-hidden border-2 ${
        isSelected
          ? 'border-[var(--glass-stroke-focus)]'
          : 'border-transparent'
      }`}
    >
      {displayImageUrl ? (
        <MediaImageWithLoading
          src={displayImageUrl}
          alt={location.name}
          containerClassName="w-full h-full"
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={(event) => {
            event.stopPropagation()
            onPreviewImage(imageUrl || null)
          }}
        />
      ) : (
        <div className="w-full h-full bg-[var(--glass-bg-muted)] flex items-center justify-center text-[var(--glass-text-tertiary)]">
          <AppIcon name="imageAlt" className="h-7 w-7" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-[var(--glass-overlay)] text-white text-xs p-1 truncate">
        {location.name}
      </div>
      {isSelected && (
        <div className="absolute top-1 right-1 w-5 h-5 bg-[var(--glass-accent-from)] text-white rounded-full flex items-center justify-center">
          <AppIcon name="checkXs" className="h-3 w-3" />
        </div>
      )}
    </button>
  )
}
