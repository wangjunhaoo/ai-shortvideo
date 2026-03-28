import { useRef, useState } from 'react'
import { logInfo as _ulogInfo } from '@/lib/logging/core'
import { shouldShowError } from '@/lib/error-utils'
import { useUploadProjectCharacterImage } from '@renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionOperations'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import type { Character, CharacterAppearance } from '@/types/project'
import type { CharacterCardStateMessages } from './types'

interface UseCharacterCardStateInput {
  projectId: string
  character: Character
  appearance: CharacterAppearance
  activeTaskKeys: Set<string>
  appearanceCount: number
  onDelete: () => void
  messages: CharacterCardStateMessages
}

export function useCharacterCardState({
  projectId,
  character,
  appearance,
  activeTaskKeys,
  appearanceCount,
  onDelete,
  messages,
}: UseCharacterCardStateInput) {
  const uploadImage = useUploadProjectCharacterImage(projectId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingUploadIndex, setPendingUploadIndex] = useState<number | undefined>(
    undefined,
  )
  const [showDeleteMenu, setShowDeleteMenu] = useState(false)
  const [isConfirmingSelection, setIsConfirmingSelection] = useState(false)

  const handleDeleteClick = () => {
    if (appearanceCount <= 1) {
      onDelete()
    } else {
      setShowDeleteMenu((prev) => !prev)
    }
  }

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
        characterId: character.id,
        appearanceId: appearance.id,
        imageIndex: uploadIndex,
        labelText: `${character.name} - ${appearance.changeReason}`,
      },
      {
        onSuccess: () => {
          alert(messages.uploadSuccess)
        },
        onError: (error) => {
          if (shouldShowError(error)) {
            alert(messages.uploadFailed(error.message))
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

  const rawImageUrls = appearance.imageUrls || []
  const imageUrlsWithIndex = rawImageUrls
    .map((url, originalIndex) => ({ url, originalIndex }))
    .filter((item) => !!item.url) as { url: string; originalIndex: number }[]

  const hasMultipleImages = imageUrlsWithIndex.length > 1
  const selectedIndex = appearance.selectedIndex ?? null
  const currentImageUrl =
    appearance.imageUrl ||
    (selectedIndex !== null ? rawImageUrls[selectedIndex] : null) ||
    imageUrlsWithIndex[0]?.url

  if (!currentImageUrl) {
    _ulogInfo(`[CharacterCard调试] ${character.name}-${appearance.changeReason}:`, {
      imageUrl: appearance.imageUrl,
      imageUrls: appearance.imageUrls,
      rawImageUrls,
      imageUrlsWithIndex,
      currentImageUrl,
    })
  }

  const showSelectionMode = hasMultipleImages
  const isImageTaskRunning = (imageIndex: number) =>
    activeTaskKeys.has(
      `character-${character.id}-${appearance.appearanceIndex}-${imageIndex}`,
    )

  const isGroupTaskRunning = activeTaskKeys.has(
    `character-${character.id}-${appearance.appearanceIndex}-group`,
  )
  const isAnyTaskRunning =
    isGroupTaskRunning ||
    Array.from(activeTaskKeys).some((key) =>
      key.startsWith(`character-${character.id}-${appearance.appearanceIndex}`),
    )

  const appearanceTaskRunning = !!appearance.imageTaskRunning
  const appearanceTaskPresentation = appearanceTaskRunning
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
    appearanceTaskPresentation || fallbackRunningPresentation
  const confirmSelectionState = isConfirmingSelection
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
  const isAppearanceTaskRunning = appearanceTaskRunning || isAnyTaskRunning

  return {
    uploadImage,
    fileInputRef,
    showDeleteMenu,
    setShowDeleteMenu,
    isConfirmingSelection,
    setIsConfirmingSelection,
    handleDeleteClick,
    triggerUpload,
    handleUpload,
    imageUrlsWithIndex,
    hasMultipleImages,
    selectedIndex,
    currentImageUrl,
    showSelectionMode,
    isImageTaskRunning,
    isGroupTaskRunning,
    isAnyTaskRunning,
    displayTaskPresentation,
    confirmSelectionState,
    uploadPendingState,
    isAppearanceTaskRunning,
  }
}
