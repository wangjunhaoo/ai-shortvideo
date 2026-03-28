'use client'

import ImagePreviewModal from '@/components/ui/ImagePreviewModal'
import ImageEditModalAssetPicker from './ImageEditModalAssetPicker'
import type { ImageEditModalAuxiliaryOverlaysProps } from './ImageEditModal.types'

export default function ImageEditModalAuxiliaryOverlays({
  labels,
  isOpen,
  characters,
  locations,
  selectedAssets,
  previewImage,
  onClose,
  onAddAsset,
  onRemoveAsset,
  onPreviewImage,
  onClosePreview,
}: ImageEditModalAuxiliaryOverlaysProps) {
  return (
    <>
      <ImageEditModalAssetPicker
        labels={labels}
        isOpen={isOpen}
        characters={characters}
        locations={locations}
        selectedAssets={selectedAssets}
        onClose={onClose}
        onAddAsset={onAddAsset}
        onRemoveAsset={onRemoveAsset}
        onPreviewImage={onPreviewImage}
      />

      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage}
          onClose={onClosePreview}
        />
      )}
    </>
  )
}
