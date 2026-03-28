'use client'

import type { Character, Location } from '@/types/project'
import type { SelectedAsset } from './hooks/useImageGeneration'

export interface ImageEditModalProps {
  projectId: string
  labels: ImageEditModalLabels
  defaultAssets: SelectedAsset[]
  onSubmit: (prompt: string, images: string[], assets: SelectedAsset[]) => void
  onClose: () => void
}

export interface ImageEditModalSelectedAssetsLabels {
  title: string
  countText: string
  addAssetLabel: string
  emptyText: string
}

export interface ImageEditModalReferenceImagesLabels {
  title: string
  hint: string
}

export interface ImageEditModalAssetPickerLabels {
  title: string
  confirmLabel: string
  characterLabel: string
  locationLabel: string
  defaultAppearanceLabel: string
}

export interface ImageEditModalLabels {
  emptyPromptMessage: string
  title: string
  subtitle: string
  promptLabel: string
  promptPlaceholder: string
  footerCancelLabel: string
  footerSubmitLabel: string
  selectedAssets: ImageEditModalSelectedAssetsLabels
  referenceImages: ImageEditModalReferenceImagesLabels
  assetPicker: ImageEditModalAssetPickerLabels
}

export interface ImageEditModalHeaderProps {
  title: string
  subtitle: string
}

export interface ImageEditModalPromptSectionProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export interface ImageEditModalBodyProps {
  promptLabel: string
  promptPlaceholder: string
  selectedAssetsLabels: ImageEditModalSelectedAssetsLabels
  referenceImagesLabels: ImageEditModalReferenceImagesLabels
  editPrompt: string
  onEditPromptChange: (value: string) => void
  selectedAssets: SelectedAsset[]
  editImages: string[]
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onOpenAssetPicker: () => void
  onPreviewImage: (url: string | null) => void
  onRemoveAsset: (assetId: string, assetType: string) => void
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
}

export interface ImageEditModalReferenceImagesProps {
  labels: ImageEditModalReferenceImagesLabels
  editImages: string[]
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
}

export interface ImageEditModalFooterProps {
  cancelLabel: string
  submitLabel: string
  isSubmitDisabled: boolean
  onClose: () => void
  onSubmit: () => void
}

export interface ImageEditModalAssetPickerBridgeProps {
  labels: ImageEditModalAssetPickerLabels
  isOpen: boolean
  characters: Character[]
  locations: Location[]
  selectedAssets: SelectedAsset[]
  onClose: () => void
  onAddAsset: (asset: SelectedAsset) => void
  onRemoveAsset: (assetId: string, assetType: string) => void
  onPreviewImage: (url: string | null) => void
}

export interface ImageEditModalAuxiliaryOverlaysProps
  extends ImageEditModalAssetPickerBridgeProps {
  previewImage: string | null
  onClosePreview: () => void
}

export interface ImageEditModalSelectedAssetsProps {
  labels: ImageEditModalSelectedAssetsLabels
  selectedAssets: SelectedAsset[]
  onOpenAssetPicker: () => void
  onPreviewImage: (url: string | null) => void
  onRemoveAsset: (assetId: string, assetType: string) => void
}

export interface ImageEditModalSelectedAssetItemProps {
  asset: SelectedAsset
  onPreviewImage: (url: string | null) => void
  onRemoveAsset: (assetId: string, assetType: string) => void
}

export interface ImageEditModalCharacterSectionProps {
  labels: ImageEditModalAssetPickerLabels
  characters: Character[]
  selectedAssets: SelectedAsset[]
  onAddAsset: (asset: SelectedAsset) => void
  onRemoveAsset: (assetId: string, assetType: string) => void
  onPreviewImage: (url: string | null) => void
}

export interface ImageEditModalCharacterCardProps {
  character: Character
  appearance: Character['appearances'][number]
  isSelected: boolean
  displayName: string
  onAddAsset: (asset: SelectedAsset) => void
  onRemoveAsset: (assetId: string, assetType: string) => void
  onPreviewImage: (url: string | null) => void
}

export interface ImageEditModalLocationSectionProps {
  labels: ImageEditModalAssetPickerLabels
  locations: Location[]
  selectedAssets: SelectedAsset[]
  onAddAsset: (asset: SelectedAsset) => void
  onRemoveAsset: (assetId: string, assetType: string) => void
  onPreviewImage: (url: string | null) => void
}

export interface ImageEditModalLocationCardProps {
  location: Location
  isSelected: boolean
  onAddAsset: (asset: SelectedAsset) => void
  onRemoveAsset: (assetId: string, assetType: string) => void
  onPreviewImage: (url: string | null) => void
}
