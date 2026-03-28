'use client'

import type { ReactNode, RefObject } from 'react'
import type { TaskPresentationState } from '@/lib/task/presentation'
import CharacterCardGallery from './CharacterCardGallery'
import CharacterCardHeader from './CharacterCardHeader'
import CharacterCardActions from './CharacterCardActions'
import type { CharacterCardActionsLabels, CharacterCardGalleryLabels } from './types'

interface CharacterCardCompactViewProps {
  fileInputRef: RefObject<HTMLInputElement | null>
  onFileChange: () => void
  characterName: string
  changeReason: string
  currentImageUrl: string | null | undefined
  selectedIndex: number | null
  hasMultipleImages: boolean
  isAppearanceTaskRunning: boolean
  isGroupTaskRunning: boolean
  displayTaskPresentation: TaskPresentationState | null
  appearanceErrorMessage?: string | null
  onImageClick: (imageUrl: string) => void
  overlayActions: ReactNode
  compactHeaderActions: ReactNode
  isPrimaryAppearance: boolean
  primaryAppearanceSelected: boolean
  isAnyTaskRunning: boolean
  hasDescription: boolean
  generationCount: number
  onGenerationCountChange: (value: number) => void
  onGenerate: (count?: number) => void
  voiceSettings: ReactNode
  galleryLabels: CharacterCardGalleryLabels
  actionLabels: CharacterCardActionsLabels
}

export function CharacterCardCompactView({
  fileInputRef,
  onFileChange,
  characterName,
  changeReason,
  currentImageUrl,
  selectedIndex,
  hasMultipleImages,
  isAppearanceTaskRunning,
  isGroupTaskRunning,
  displayTaskPresentation,
  appearanceErrorMessage,
  onImageClick,
  overlayActions,
  compactHeaderActions,
  isPrimaryAppearance,
  primaryAppearanceSelected,
  isAnyTaskRunning,
  hasDescription,
  generationCount,
  onGenerationCountChange,
  onGenerate,
  voiceSettings,
  galleryLabels,
  actionLabels,
}: CharacterCardCompactViewProps) {
  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />

      <div className="relative">
        <CharacterCardGallery
          mode="single"
          characterName={characterName}
          changeReason={changeReason}
          currentImageUrl={currentImageUrl}
          selectedIndex={selectedIndex}
          hasMultipleImages={hasMultipleImages}
          isAppearanceTaskRunning={isAppearanceTaskRunning || isGroupTaskRunning}
          displayTaskPresentation={displayTaskPresentation}
          appearanceErrorMessage={appearanceErrorMessage}
          onImageClick={onImageClick}
          overlayActions={overlayActions}
          labels={galleryLabels}
        />
      </div>

      <CharacterCardHeader
        mode="compact"
        characterName={characterName}
        changeReason={changeReason}
        actions={compactHeaderActions}
      />

      <CharacterCardActions
        mode="compact"
        isPrimaryAppearance={isPrimaryAppearance}
        primaryAppearanceSelected={primaryAppearanceSelected}
        currentImageUrl={currentImageUrl}
        isAppearanceTaskRunning={isAppearanceTaskRunning}
        isAnyTaskRunning={isAnyTaskRunning}
        hasDescription={hasDescription}
        generationCount={generationCount}
        onGenerationCountChange={onGenerationCountChange}
        onGenerate={onGenerate}
        voiceSettings={voiceSettings}
        labels={actionLabels}
      />
    </div>
  )
}
