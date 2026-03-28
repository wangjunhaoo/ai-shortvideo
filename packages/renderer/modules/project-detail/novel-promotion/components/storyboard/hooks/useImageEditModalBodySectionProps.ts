'use client'

import type { ComponentProps } from 'react'
import ImageEditModalPromptSection from '../ImageEditModalPromptSection'
import ImageEditModalReferenceImages from '../ImageEditModalReferenceImages'
import ImageEditModalSelectedAssets from '../ImageEditModalSelectedAssets'
import type { ImageEditModalBodyProps } from '../ImageEditModal.types'

export function useImageEditModalBodySectionProps({
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
  const promptSectionProps: ComponentProps<typeof ImageEditModalPromptSection> = {
    label: promptLabel,
    placeholder: promptPlaceholder,
    value: editPrompt,
    onChange: onEditPromptChange,
  }

  const selectedAssetsProps: ComponentProps<typeof ImageEditModalSelectedAssets> = {
    labels: selectedAssetsLabels,
    selectedAssets,
    onOpenAssetPicker,
    onPreviewImage,
    onRemoveAsset,
  }

  const referenceImagesProps: ComponentProps<typeof ImageEditModalReferenceImages> = {
    labels: referenceImagesLabels,
    editImages,
    fileInputRef,
    onImageUpload,
    onRemoveImage,
  }

  return {
    promptSectionProps,
    selectedAssetsProps,
    referenceImagesProps,
  }
}
