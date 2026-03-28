'use client'

import ImageEditModalCharacterSection from './ImageEditModalCharacterSection'
import ImageEditModalAssetPickerFooter from './ImageEditModalAssetPickerFooter'
import ImageEditModalAssetPickerHeader from './ImageEditModalAssetPickerHeader'
import ImageEditModalLocationSection from './ImageEditModalLocationSection'
import type { ImageEditModalAssetPickerBridgeProps } from './ImageEditModal.types'

export default function ImageEditModalAssetPicker({
  labels,
  isOpen,
  characters,
  locations,
  selectedAssets,
  onClose,
  onAddAsset,
  onRemoveAsset,
  onPreviewImage,
}: ImageEditModalAssetPickerBridgeProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 glass-overlay z-[60] flex items-center justify-center p-4">
      <div className="glass-surface-modal w-full max-w-lg max-h-[80vh] overflow-hidden">
        <ImageEditModalAssetPickerHeader
          title={labels.title}
          onClose={onClose}
        />

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <ImageEditModalCharacterSection
            labels={labels}
            characters={characters}
            selectedAssets={selectedAssets}
            onAddAsset={onAddAsset}
            onRemoveAsset={onRemoveAsset}
            onPreviewImage={onPreviewImage}
          />

          <ImageEditModalLocationSection
            labels={labels}
            locations={locations}
            selectedAssets={selectedAssets}
            onAddAsset={onAddAsset}
            onRemoveAsset={onRemoveAsset}
            onPreviewImage={onPreviewImage}
          />
        </div>

        <ImageEditModalAssetPickerFooter
          confirmLabel={labels.confirmLabel}
          onClose={onClose}
        />
      </div>
    </div>
  )
}
