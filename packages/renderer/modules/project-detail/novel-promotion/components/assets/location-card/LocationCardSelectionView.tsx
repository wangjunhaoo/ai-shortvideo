'use client'

import type { ReactNode, RefObject } from 'react'
import type { TaskPresentationState } from '@/lib/task/presentation'
import type { Location } from '@/types/project'
import LocationCardHeader from './LocationCardHeader'
import LocationImageList from './LocationImageList'
import LocationCardActions from './LocationCardActions'
import type { LocationCardActionsLabels, LocationCardHeaderLabels, LocationImageListLabels } from './types'

interface LocationCardSelectionViewProps {
  fileInputRef: RefObject<HTMLInputElement | null>
  onFileChange: () => void
  location: Location
  displaySelectionImages: Location['images']
  selectedIndex: number | null
  isGroupTaskRunning: boolean
  isImageTaskRunning: (imageIndex: number) => boolean
  displayTaskPresentation: TaskPresentationState | null
  onImageClick: (imageUrl: string) => void
  onSelectImage?: (locationId: string, imageIndex: number | null) => void
  selectionStatusText: string
  selectionHeaderActions: ReactNode
  isConfirmingSelection: boolean
  confirmingSelectionState: TaskPresentationState | null
  onConfirmSelection?: () => void
  headerLabels: LocationCardHeaderLabels
  imageListLabels: LocationImageListLabels
  actionLabels: LocationCardActionsLabels
}

export function LocationCardSelectionView({
  fileInputRef,
  onFileChange,
  location,
  displaySelectionImages,
  selectedIndex,
  isGroupTaskRunning,
  isImageTaskRunning,
  displayTaskPresentation,
  onImageClick,
  onSelectImage,
  selectionStatusText,
  selectionHeaderActions,
  isConfirmingSelection,
  confirmingSelectionState,
  onConfirmSelection,
  headerLabels,
  imageListLabels,
  actionLabels,
}: LocationCardSelectionViewProps) {
  return (
    <div className="col-span-3 glass-surface-elevated p-4 transition-all">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />
      <LocationCardHeader
        mode="selection"
        locationName={location.name}
        summary={location.summary}
        selectedIndex={selectedIndex}
        statusText={selectionStatusText}
        actions={selectionHeaderActions}
        labels={headerLabels}
      />

      <LocationImageList
        mode="selection"
        locationId={location.id}
        locationName={location.name}
        images={displaySelectionImages}
        selectedImageId={location.selectedImageId}
        selectedIndex={selectedIndex}
        isGroupTaskRunning={isGroupTaskRunning}
        isImageTaskRunning={isImageTaskRunning}
        displayTaskPresentation={displayTaskPresentation}
        onImageClick={onImageClick}
        onSelectImage={onSelectImage}
        labels={imageListLabels}
      />

      <LocationCardActions
        mode="selection"
        selectedIndex={selectedIndex}
        isConfirmingSelection={isConfirmingSelection}
        confirmingSelectionState={confirmingSelectionState}
        onConfirmSelection={onConfirmSelection}
        labels={actionLabels}
      />
    </div>
  )
}
