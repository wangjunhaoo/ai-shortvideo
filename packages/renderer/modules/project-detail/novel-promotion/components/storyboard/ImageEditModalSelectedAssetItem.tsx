'use client'

import { toDisplayImageUrl } from '@/lib/media/image-url'
import { MediaImageWithLoading } from '@/components/media/MediaImageWithLoading'
import { AppIcon } from '@/components/ui/icons'
import type { ImageEditModalSelectedAssetItemProps } from './ImageEditModal.types'

export default function ImageEditModalSelectedAssetItem({
  asset,
  onPreviewImage,
  onRemoveAsset,
}: ImageEditModalSelectedAssetItemProps) {
  const displayImageUrl = toDisplayImageUrl(asset.imageUrl)

  return (
    <div className="relative w-14 h-14 group">
      {displayImageUrl ? (
        <MediaImageWithLoading
          src={displayImageUrl}
          alt={asset.name}
          containerClassName="w-full h-full rounded-lg"
          className="w-full h-full object-cover rounded-lg border cursor-zoom-in"
          onClick={() => onPreviewImage(asset.imageUrl || null)}
        />
      ) : (
        <div className="w-full h-full bg-[var(--glass-bg-muted)] rounded-lg flex items-center justify-center text-[var(--glass-text-tertiary)] text-xs">
          {asset.type === 'character' ? (
            <AppIcon name="user" className="h-4 w-4" />
          ) : (
            <AppIcon name="imageAlt" className="h-4 w-4" />
          )}
        </div>
      )}
      <button
        onClick={(event) => {
          event.stopPropagation()
          onRemoveAsset(asset.id, asset.type)
        }}
        className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--glass-tone-danger-fg)] text-white rounded-full text-xs flex items-center justify-center hover:bg-[var(--glass-tone-danger-fg)] opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <AppIcon name="closeSm" className="h-3 w-3" />
      </button>
      <div className="absolute bottom-0 left-0 right-0 bg-[var(--glass-overlay)] text-white text-xs px-1 py-0.5 rounded-b-lg truncate">
        {asset.name}
      </div>
    </div>
  )
}
