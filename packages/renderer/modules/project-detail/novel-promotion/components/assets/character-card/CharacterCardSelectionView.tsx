'use client'

import type { ReactNode, RefObject } from 'react'
import type { TaskPresentationState } from '@/lib/task/presentation'
import CharacterCardHeader from './CharacterCardHeader'
import CharacterCardGallery from './CharacterCardGallery'
import CharacterCardActions from './CharacterCardActions'
import type { CharacterCardActionsLabels, CharacterCardGalleryLabels, CharacterCardHeaderLabels } from './types'

interface CharacterCardSelectionViewProps {
  fileInputRef: RefObject<HTMLInputElement | null>
  onFileChange: () => void
  characterId: string
  appearanceId: string
  characterName: string
  changeReason: string
  isPrimaryAppearance: boolean
  selectedIndex: number | null
  imageUrlsWithIndex: { url: string; originalIndex: number }[]
  isGroupTaskRunning: boolean
  isImageTaskRunning: (imageIndex: number) => boolean
  displayTaskPresentation: TaskPresentationState | null
  onImageClick: (imageUrl: string) => void
  onSelectImage?: (characterId: string, appearanceId: string, imageIndex: number | null) => void
  selectionActions: ReactNode
  isConfirmingSelection: boolean
  confirmSelectionState: TaskPresentationState | null
  onConfirmSelection: () => void
  voiceSettings: ReactNode
  headerLabels: CharacterCardHeaderLabels
  galleryLabels: CharacterCardGalleryLabels
  actionLabels: CharacterCardActionsLabels
}

export function CharacterCardSelectionView({
  fileInputRef,
  onFileChange,
  characterId,
  appearanceId,
  characterName,
  changeReason,
  isPrimaryAppearance,
  selectedIndex,
  imageUrlsWithIndex,
  isGroupTaskRunning,
  isImageTaskRunning,
  displayTaskPresentation,
  onImageClick,
  onSelectImage,
  selectionActions,
  isConfirmingSelection,
  confirmSelectionState,
  onConfirmSelection,
  voiceSettings,
  headerLabels,
  galleryLabels,
  actionLabels,
}: CharacterCardSelectionViewProps) {
  return (
    <div className="col-span-3 bg-[var(--glass-bg-surface)] rounded-lg border-2 border-[var(--glass-stroke-base)] p-4 shadow-sm transition-all">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />

      <CharacterCardHeader
        mode="selection"
        characterName={characterName}
        changeReason={changeReason}
        isPrimaryAppearance={isPrimaryAppearance}
        selectedIndex={selectedIndex}
        labels={headerLabels}
        actions={selectionActions}
      />

      <CharacterCardGallery
        mode="selection"
        characterId={characterId}
        appearanceId={appearanceId}
        characterName={characterName}
        imageUrlsWithIndex={imageUrlsWithIndex}
        selectedIndex={selectedIndex}
        isGroupTaskRunning={isGroupTaskRunning}
        isImageTaskRunning={isImageTaskRunning}
        displayTaskPresentation={displayTaskPresentation}
        onImageClick={onImageClick}
        onSelectImage={onSelectImage}
        labels={galleryLabels}
      />

      <CharacterCardActions
        mode="selection"
        selectedIndex={selectedIndex}
        isConfirmingSelection={isConfirmingSelection}
        confirmSelectionState={confirmSelectionState}
        onConfirmSelection={onConfirmSelection}
        isPrimaryAppearance={isPrimaryAppearance}
        voiceSettings={voiceSettings}
        labels={actionLabels}
      />
    </div>
  )
}
