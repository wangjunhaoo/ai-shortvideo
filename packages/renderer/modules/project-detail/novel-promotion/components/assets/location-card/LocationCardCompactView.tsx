'use client'

import type { ReactNode, RefObject } from 'react'
import type { TaskPresentationState } from '@/lib/task/presentation'
import LocationImageList from './LocationImageList'
import LocationCardHeader from './LocationCardHeader'
import LocationCardActions from './LocationCardActions'
import type { LocationCardActionsLabels, LocationImageListLabels } from './types'

interface LocationCardCompactViewProps {
  fileInputRef: RefObject<HTMLInputElement | null>
  onFileChange: () => void
  locationName: string
  summary?: string | null
  currentImageUrl: string | null
  selectedIndex: number | null
  hasMultipleImages: boolean
  isTaskRunning: boolean
  displayTaskPresentation: TaskPresentationState | null
  imageErrorMessage?: string | null
  onImageClick: (imageUrl: string) => void
  singleOverlayActions: ReactNode
  compactHeaderActions: ReactNode
  hasDescription: boolean
  generationCount: number
  onGenerationCountChange: (value: number) => void
  onGenerate: (count?: number) => void
  imageListLabels: LocationImageListLabels
  actionLabels: LocationCardActionsLabels
}

export function LocationCardCompactView({
  fileInputRef,
  onFileChange,
  locationName,
  summary,
  currentImageUrl,
  selectedIndex,
  hasMultipleImages,
  isTaskRunning,
  displayTaskPresentation,
  imageErrorMessage,
  onImageClick,
  singleOverlayActions,
  compactHeaderActions,
  hasDescription,
  generationCount,
  onGenerationCountChange,
  onGenerate,
  imageListLabels,
  actionLabels,
}: LocationCardCompactViewProps) {
  return (
    <div className="flex flex-col gap-2 glass-surface-elevated p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />
      <div className="relative">
        <LocationImageList
          mode="single"
          locationName={locationName}
          currentImageUrl={currentImageUrl}
          selectedIndex={selectedIndex}
          hasMultipleImages={hasMultipleImages}
          isTaskRunning={isTaskRunning}
          displayTaskPresentation={displayTaskPresentation}
          imageErrorMessage={imageErrorMessage}
          onImageClick={onImageClick}
          overlayActions={singleOverlayActions}
          labels={imageListLabels}
        />
      </div>

      <LocationCardHeader
        mode="compact"
        locationName={locationName}
        summary={summary}
        actions={compactHeaderActions}
      />

      <LocationCardActions
        mode="compact"
        currentImageUrl={currentImageUrl}
        isTaskRunning={isTaskRunning}
        hasDescription={hasDescription}
        generationCount={generationCount}
        onGenerationCountChange={onGenerationCountChange}
        onGenerate={onGenerate}
        labels={actionLabels}
      />
    </div>
  )
}
