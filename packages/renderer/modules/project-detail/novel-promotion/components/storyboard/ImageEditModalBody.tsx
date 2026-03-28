'use client'

import ImageEditModalReferenceImages from './ImageEditModalReferenceImages'
import ImageEditModalSelectedAssets from './ImageEditModalSelectedAssets'
import ImageEditModalPromptSection from './ImageEditModalPromptSection'
import type { ImageEditModalBodyProps } from './ImageEditModal.types'
import { useImageEditModalBodySectionProps } from './hooks/useImageEditModalBodySectionProps'

export default function ImageEditModalBody({
  promptLabel,
  promptPlaceholder,
  selectedAssetsLabels,
  referenceImagesLabels,
  editPrompt,
  onEditPromptChange,
  selectedAssets,
  editImages,
  fileInputRef,
  onOpenAssetPicker,
  onPreviewImage,
  onRemoveAsset,
  onImageUpload,
  onRemoveImage,
}: ImageEditModalBodyProps) {
  const {
    promptSectionProps,
    selectedAssetsProps,
    referenceImagesProps,
  } = useImageEditModalBodySectionProps({
    promptLabel,
    promptPlaceholder,
    selectedAssetsLabels,
    referenceImagesLabels,
    editPrompt,
    onEditPromptChange,
    selectedAssets,
    editImages,
    fileInputRef,
    onOpenAssetPicker,
    onPreviewImage,
    onRemoveAsset,
    onImageUpload,
    onRemoveImage,
  })

  return (
    <div className="p-6 space-y-4">
      <ImageEditModalPromptSection {...promptSectionProps} />

      <ImageEditModalSelectedAssets {...selectedAssetsProps} />

      <ImageEditModalReferenceImages {...referenceImagesProps} />
    </div>
  )
}
