'use client'
import { Character, Location } from '@/types/project'
import { useProjectAssets } from '@renderer/hooks/useRendererProjectQueries'
import ImageEditModalAuxiliaryOverlays from './ImageEditModalAuxiliaryOverlays'
import ImageEditModalBody from './ImageEditModalBody'
import ImageEditModalFooter from './ImageEditModalFooter'
import ImageEditModalHeader from './ImageEditModalHeader'
import type { ImageEditModalProps } from './ImageEditModal.types'
import { useImageEditModalState } from './hooks/useImageEditModalState'
import { useImageEditModalViewProps } from './hooks/useImageEditModalViewProps'

export default function ImageEditModal({
  projectId,
  labels,
  defaultAssets,
  onSubmit,
  onClose,
}: ImageEditModalProps) {
  const { data: assets } = useProjectAssets(projectId)
  const characters: Character[] = assets?.characters ?? []
  const locations: Location[] = assets?.locations ?? []

  const {
    editPrompt,
    setEditPrompt,
    editImages,
    selectedAssets,
    showAssetPicker,
    setShowAssetPicker,
    previewImage,
    setPreviewImage,
    fileInputRef,
    handleImageUpload,
    handlePaste,
    removeImage,
    handleAddAsset,
    handleRemoveAsset,
    handleSubmit,
  } = useImageEditModalState({
    defaultAssets,
    emptyPromptMessage: labels.emptyPromptMessage,
    onSubmit,
  })

  const { headerProps, bodyProps, footerProps, overlaysProps } =
    useImageEditModalViewProps({
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
      onEditPromptChange: setEditPrompt,
      onOpenAssetPicker: () => setShowAssetPicker(true),
      onCloseAssetPicker: () => setShowAssetPicker(false),
      onPreviewImage: setPreviewImage,
      onClosePreview: () => setPreviewImage(null),
      onRemoveAsset: handleRemoveAsset,
      onImageUpload: handleImageUpload,
      onRemoveImage: removeImage,
      onAddAsset: handleAddAsset,
      onSubmit: handleSubmit,
    })

  return (
    <div className="fixed inset-0 bg-[var(--glass-overlay)] z-50 flex items-center justify-center p-4">
      <div
        className="bg-[var(--glass-bg-surface)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onPaste={handlePaste}
      >
        <ImageEditModalHeader {...headerProps} />

        <ImageEditModalBody {...bodyProps} />

        <ImageEditModalFooter {...footerProps} />
      </div>

      <ImageEditModalAuxiliaryOverlays {...overlaysProps} />
    </div>
  )
}
