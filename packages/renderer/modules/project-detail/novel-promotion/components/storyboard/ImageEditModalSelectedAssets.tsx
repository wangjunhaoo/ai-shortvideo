'use client'

import ImageEditModalSelectedAssetItem from './ImageEditModalSelectedAssetItem'
import ImageEditModalSelectedAssetsHeader from './ImageEditModalSelectedAssetsHeader'
import type { ImageEditModalSelectedAssetsProps } from './ImageEditModal.types'

export default function ImageEditModalSelectedAssets({
  labels,
  selectedAssets,
  onOpenAssetPicker,
  onPreviewImage,
  onRemoveAsset,
}: ImageEditModalSelectedAssetsProps) {
  return (
    <div>
      <ImageEditModalSelectedAssetsHeader
        labels={labels}
        selectedCount={selectedAssets.length}
        onOpenAssetPicker={onOpenAssetPicker}
      />

      <div className="flex flex-wrap gap-2 min-h-[64px] p-2 bg-[var(--glass-bg-muted)] rounded-lg">
        {selectedAssets.length === 0 ? (
          <p className="text-sm text-[var(--glass-text-tertiary)] w-full text-center py-4">
            {labels.emptyText}
          </p>
        ) : (
          selectedAssets.map((asset) => (
            <ImageEditModalSelectedAssetItem
              key={`${asset.type}-${asset.id}`}
              asset={asset}
              onPreviewImage={onPreviewImage}
              onRemoveAsset={onRemoveAsset}
            />
          ))
        )}
      </div>
    </div>
  )
}
