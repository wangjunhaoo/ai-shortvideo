'use client'

import { useMemo, type ComponentProps, type RefObject } from 'react'
import type { Character, Location } from '@/types/project'
import ImageEditModalAuxiliaryOverlays from '../ImageEditModalAuxiliaryOverlays'
import ImageEditModalBody from '../ImageEditModalBody'
import ImageEditModalFooter from '../ImageEditModalFooter'
import ImageEditModalHeader from '../ImageEditModalHeader'
import type { ImageEditModalLabels } from '../ImageEditModal.types'
import type { SelectedAsset } from './useImageGeneration'

interface UseImageEditModalViewPropsParams {
  labels: ImageEditModalLabels
  characters: Character[]
  locations: Location[]
  editPrompt: string
  editImages: string[]
  selectedAssets: SelectedAsset[]
  showAssetPicker: boolean
  previewImage: string | null
  fileInputRef: RefObject<HTMLInputElement | null>
  onClose: () => void
  onEditPromptChange: (value: string) => void
  onOpenAssetPicker: () => void
  onCloseAssetPicker: () => void
  onPreviewImage: (url: string | null) => void
  onClosePreview: () => void
  onRemoveAsset: (assetId: string, assetType: string) => void
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
  onAddAsset: (asset: SelectedAsset) => void
  onSubmit: () => void
}

export function useImageEditModalViewProps({
  labels,
  characters,
  locations,
  editPrompt,
  editImages,
  selectedAssets,
  showAssetPicker,
  previewImage,
  fileInputRef,
  onClose,
  onEditPromptChange,
  onOpenAssetPicker,
  onCloseAssetPicker,
  onPreviewImage,
  onClosePreview,
  onRemoveAsset,
  onImageUpload,
  onRemoveImage,
  onAddAsset,
  onSubmit,
}: UseImageEditModalViewPropsParams) {
  const headerProps = useMemo(
    () =>
      ({
        title: labels.title,
        subtitle: labels.subtitle,
      }) satisfies ComponentProps<typeof ImageEditModalHeader>,
    [labels.subtitle, labels.title],
  )

  const bodyProps = useMemo(
    () =>
      ({
        promptLabel: labels.promptLabel,
        promptPlaceholder: labels.promptPlaceholder,
        selectedAssetsLabels: labels.selectedAssets,
        referenceImagesLabels: labels.referenceImages,
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
      }) satisfies ComponentProps<typeof ImageEditModalBody>,
    [
      editImages,
      editPrompt,
      fileInputRef,
      labels.promptLabel,
      labels.promptPlaceholder,
      labels.referenceImages,
      labels.selectedAssets,
      onEditPromptChange,
      onImageUpload,
      onOpenAssetPicker,
      onPreviewImage,
      onRemoveAsset,
      onRemoveImage,
      selectedAssets,
    ],
  )

  const footerProps = useMemo(
    () =>
      ({
        cancelLabel: labels.footerCancelLabel,
        submitLabel: labels.footerSubmitLabel,
        isSubmitDisabled: !editPrompt.trim(),
        onClose,
        onSubmit,
      }) satisfies ComponentProps<typeof ImageEditModalFooter>,
    [editPrompt, labels.footerCancelLabel, labels.footerSubmitLabel, onClose, onSubmit],
  )

  const overlaysProps = useMemo(
    () =>
      ({
        labels: labels.assetPicker,
        isOpen: showAssetPicker,
        characters,
        locations,
        selectedAssets,
        previewImage,
        onClose: onCloseAssetPicker,
        onAddAsset,
        onRemoveAsset,
        onPreviewImage,
        onClosePreview,
      }) satisfies ComponentProps<typeof ImageEditModalAuxiliaryOverlays>,
    [
      characters,
      labels.assetPicker,
      locations,
      onAddAsset,
      onCloseAssetPicker,
      onClosePreview,
      onPreviewImage,
      onRemoveAsset,
      previewImage,
      selectedAssets,
      showAssetPicker,
    ],
  )

  return {
    headerProps,
    bodyProps,
    footerProps,
    overlaysProps,
  }
}
