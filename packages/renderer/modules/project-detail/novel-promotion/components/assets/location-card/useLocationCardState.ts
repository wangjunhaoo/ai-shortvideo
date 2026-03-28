import { useRef, useState } from 'react'
import { shouldShowError } from '@/lib/error-utils'
import { useUploadProjectLocationImage } from '@renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionOperations'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { countGeneratedImageSlots, resolveDisplayImageSlots } from '@/lib/image-generation/slot-state'
import type { Location } from '@/types/project'
import type { LocationCardStateMessages } from './types'

interface UseLocationCardStateInput {
  projectId: string
  location: Location
  activeTaskKeys: Set<string>
  generationCount: number
  messages: LocationCardStateMessages
}

export function useLocationCardState({
  projectId,
  location,
  activeTaskKeys,
  generationCount,
  messages,
}: UseLocationCardStateInput) {
  const uploadImage = useUploadProjectLocationImage(projectId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingUploadIndex, setPendingUploadIndex] = useState<number | undefined>(
    undefined,
  )
  const [isConfirmingSelection, setIsConfirmingSelection] = useState(false)

  const triggerUpload = (imageIndex?: number) => {
    setPendingUploadIndex(imageIndex)
    fileInputRef.current?.click()
  }

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    const uploadIndex = pendingUploadIndex

    uploadImage.mutate(
      {
        file,
        locationId: location.id,
        imageIndex: uploadIndex,
        labelText: location.name,
      },
      {
        onSuccess: () => {
          alert(messages.uploadSuccess)
        },
        onError: (error) => {
          if (shouldShowError(error)) {
            alert(messages.uploadFailedError(error.message))
          }
        },
        onSettled: () => {
          setPendingUploadIndex(undefined)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        },
      },
    )
  }

  const orderedImages = [...(location.images || [])].sort(
    (left, right) => left.imageIndex - right.imageIndex,
  )
  const imagesWithUrl = orderedImages.filter((image) => image.imageUrl)
  const generatedImageCount = countGeneratedImageSlots(orderedImages)

  const selectedImage = location.selectedImageId
    ? orderedImages.find((image) => image.id === location.selectedImageId)
    : orderedImages.find((image) => image.isSelected)
  const selectedIndex = selectedImage?.imageIndex ?? null

  const currentImageUrl = selectedImage?.imageUrl || imagesWithUrl[0]?.imageUrl || null
  const currentImageIndex = selectedIndex ?? imagesWithUrl[0]?.imageIndex ?? 0

  const isImageTaskRunning = (imageIndex: number) =>
    activeTaskKeys.has(`location-${location.id}-${imageIndex}`)

  const isGroupTaskRunning = activeTaskKeys.has(`location-${location.id}-group`)
  const isAnyTaskRunning =
    isGroupTaskRunning ||
    Array.from(activeTaskKeys).some((key) => key.startsWith(`location-${location.id}`))

  const locationTaskRunning = (location.images || []).some(
    (image) => !!image.imageTaskRunning,
  )
  const locationTaskPresentation = locationTaskRunning
    ? resolveTaskPresentationState({
        phase: 'processing',
        intent: currentImageUrl ? 'regenerate' : 'generate',
        resource: 'image',
        hasOutput: !!currentImageUrl,
      })
    : null
  const fallbackRunningPresentation = isAnyTaskRunning
    ? resolveTaskPresentationState({
        phase: 'processing',
        intent: 'regenerate',
        resource: 'image',
        hasOutput: !!currentImageUrl,
      })
    : null
  const displayTaskPresentation =
    locationTaskPresentation || fallbackRunningPresentation
  const confirmingSelectionState = isConfirmingSelection
    ? resolveTaskPresentationState({
        phase: 'processing',
        intent: 'process',
        resource: 'image',
        hasOutput: !!currentImageUrl,
      })
    : null
  const uploadPendingState = uploadImage.isPending
    ? resolveTaskPresentationState({
        phase: 'processing',
        intent: 'process',
        resource: 'image',
        hasOutput: !!currentImageUrl,
      })
    : null

  const isTaskRunning = locationTaskRunning || isAnyTaskRunning
  const displaySelectionImages = resolveDisplayImageSlots(orderedImages, {
    hasRunningTask: isTaskRunning,
    requestedCount: generationCount,
  })
  const displaySlotCount = displaySelectionImages.length
  const hasMultipleImages = generatedImageCount > 1
  const hasPreviousVersion = location.images?.some((image) => image.previousImageUrl) || false
  const showSelectionMode = displaySlotCount > 1
  const firstImage = location.images?.[0]

  return {
    uploadImage,
    fileInputRef,
    isConfirmingSelection,
    setIsConfirmingSelection,
    triggerUpload,
    handleUpload,
    orderedImages,
    generatedImageCount,
    selectedIndex,
    currentImageUrl,
    currentImageIndex,
    isImageTaskRunning,
    isGroupTaskRunning,
    isAnyTaskRunning,
    displayTaskPresentation,
    confirmingSelectionState,
    uploadPendingState,
    isTaskRunning,
    displaySelectionImages,
    displaySlotCount,
    hasMultipleImages,
    hasPreviousVersion,
    showSelectionMode,
    firstImage,
  }
}
