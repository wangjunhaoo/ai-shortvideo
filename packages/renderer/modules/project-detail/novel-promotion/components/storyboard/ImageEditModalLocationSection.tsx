'use client'

import { AppIcon } from '@/components/ui/icons'
import ImageEditModalLocationCard from './ImageEditModalLocationCard'
import type { ImageEditModalLocationSectionProps } from './ImageEditModal.types'

export default function ImageEditModalLocationSection({
  labels,
  locations,
  selectedAssets,
  onAddAsset,
  onRemoveAsset,
  onPreviewImage,
}: ImageEditModalLocationSectionProps) {
  if (locations.length === 0) {
    return null
  }

  return (
    <div>
      <h5 className="text-sm font-medium text-[var(--glass-text-secondary)] mb-2 flex items-center gap-1.5">
        <AppIcon name="imageAlt" className="h-4 w-4 text-[var(--glass-text-tertiary)]" />
        <span>{labels.locationLabel}</span>
      </h5>

      <div className="grid grid-cols-4 gap-2">
        {locations.map((location) => {
          const isSelected = selectedAssets.some(
            (asset) => asset.id === location.id && asset.type === 'location',
          )

          return (
            <ImageEditModalLocationCard
              key={location.id}
              location={location}
              isSelected={isSelected}
              onAddAsset={onAddAsset}
              onRemoveAsset={onRemoveAsset}
              onPreviewImage={onPreviewImage}
            />
          )
        })}
      </div>
    </div>
  )
}
