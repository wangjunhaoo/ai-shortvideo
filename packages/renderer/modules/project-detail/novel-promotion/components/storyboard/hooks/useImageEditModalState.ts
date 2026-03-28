'use client'

import { useCallback, useRef, useState } from 'react'
import type { SelectedAsset } from '../hooks/useImageGeneration'

interface UseImageEditModalStateParams {
  defaultAssets: SelectedAsset[]
  emptyPromptMessage: string
  onSubmit: (prompt: string, images: string[], assets: SelectedAsset[]) => void
}

function appendImageFromFile(
  file: File,
  onLoad: (base64: string) => void,
) {
  const reader = new FileReader()
  reader.onload = (event) => {
    const base64 = event.target?.result
    if (typeof base64 === 'string') {
      onLoad(base64)
    }
  }
  reader.readAsDataURL(file)
}

export function useImageEditModalState({
  defaultAssets,
  emptyPromptMessage,
  onSubmit,
}: UseImageEditModalStateParams) {
  const [editPrompt, setEditPrompt] = useState('')
  const [editImages, setEditImages] = useState<string[]>([])
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>(defaultAssets)
  const [showAssetPicker, setShowAssetPicker] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const appendImage = useCallback((base64: string) => {
    setEditImages((previous) => [...previous, base64])
  }, [])

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => appendImageFromFile(file, appendImage))
    event.target.value = ''
  }, [appendImage])

  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    const items = event.clipboardData.items
    for (let index = 0; index < items.length; index += 1) {
      if (!items[index].type.startsWith('image/')) {
        continue
      }
      const file = items[index].getAsFile()
      if (file) {
        appendImageFromFile(file, appendImage)
      }
    }
  }, [appendImage])

  const removeImage = useCallback((index: number) => {
    setEditImages((previous) => previous.filter((_, imageIndex) => imageIndex !== index))
  }, [])

  const handleAddAsset = useCallback((asset: SelectedAsset) => {
    setSelectedAssets((previous) => {
      if (previous.some((item) => item.id === asset.id && item.type === asset.type)) {
        return previous
      }
      return [...previous, asset]
    })
  }, [])

  const handleRemoveAsset = useCallback((assetId: string, assetType: string) => {
    setSelectedAssets((previous) =>
      previous.filter((item) => !(item.id === assetId && item.type === assetType)),
    )
  }, [])

  const handleSubmit = useCallback(() => {
    if (!editPrompt.trim()) {
      alert(emptyPromptMessage)
      return
    }
    onSubmit(editPrompt, editImages, selectedAssets)
  }, [editImages, editPrompt, emptyPromptMessage, onSubmit, selectedAssets])

  return {
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
  }
}
