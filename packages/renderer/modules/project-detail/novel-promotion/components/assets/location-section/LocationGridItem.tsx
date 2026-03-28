'use client'

import { logInfo as _ulogInfo } from '@/lib/logging/core'
import type { Location } from '@/types/project'
import LocationCard from '../LocationCard'
import type {
  LocationCardActionsLabels,
  LocationCardHeaderLabels,
  LocationCardOverlayLabels,
  LocationCardSelectionLabels,
  LocationCardStateMessages,
  LocationImageListLabels,
} from '../location-card/types'

interface LocationGridItemProps {
  projectId: string
  location: Location
  activeTaskKeys: Set<string>
  onClearTaskKey: (key: string) => void
  onRegisterTransientTaskKey: (key: string) => void
  onDeleteLocation: (locationId: string) => void
  onEditLocation: (location: Location) => void
  handleGenerateImage: (
    type: 'character' | 'location',
    id: string,
    appearanceId?: string,
    count?: number,
  ) => Promise<void>
  onSelectImage: (locationId: string, imageIndex: number | null) => void
  onConfirmSelection: (locationId: string) => void
  onRegenerateSingle: (locationId: string, imageIndex: number) => Promise<void>
  onRegenerateGroup: (locationId: string, count?: number) => Promise<void>
  onUndo: (locationId: string) => void
  onImageClick: (imageUrl: string) => void
  onImageEdit: (locationId: string, imageIndex: number, locationName: string) => void
  onCopyFromGlobal: (locationId: string) => void
  labels: {
    stateMessages: LocationCardStateMessages
    header: LocationCardHeaderLabels
    imageList: LocationImageListLabels
    actions: LocationCardActionsLabels
    selection: LocationCardSelectionLabels
    overlay: LocationCardOverlayLabels
  }
}

export function LocationGridItem({
  projectId,
  location,
  activeTaskKeys,
  onClearTaskKey,
  onRegisterTransientTaskKey,
  onDeleteLocation,
  onEditLocation,
  handleGenerateImage,
  onSelectImage,
  onConfirmSelection,
  onRegenerateSingle,
  onRegenerateGroup,
  onUndo,
  onImageClick,
  onImageEdit,
  onCopyFromGlobal,
  labels,
}: LocationGridItemProps) {
  return (
    <LocationCard
      location={location}
      onEdit={() => onEditLocation(location)}
      onDelete={() => onDeleteLocation(location.id)}
      onRegenerate={(count) => {
        const validImages = location.images?.filter((image) => image.imageUrl) || []

        _ulogInfo('[LocationSection] 重新生成判断:', {
          locationName: location.name,
          images: location.images,
          validImages,
          validImageCount: validImages.length,
        })

        if (validImages.length === 1) {
          const imageIndex = validImages[0].imageIndex
          const taskKey = `location-${location.id}-${imageIndex}`
          _ulogInfo('[LocationSection] 调用单张重新生成, imageIndex:', imageIndex)
          onRegisterTransientTaskKey(taskKey)
          void onRegenerateSingle(location.id, imageIndex).catch(() => {
            onClearTaskKey(taskKey)
          })
        } else {
          const taskKey = `location-${location.id}-group`
          _ulogInfo('[LocationSection] 调用整组重新生成')
          onRegisterTransientTaskKey(taskKey)
          void onRegenerateGroup(location.id, count).catch(() => {
            onClearTaskKey(taskKey)
          })
        }
      }}
      onGenerate={(count) => {
        const taskKey = `location-${location.id}-group`
        onRegisterTransientTaskKey(taskKey)
        void handleGenerateImage('location', location.id, undefined, count).catch(
          () => {
            onClearTaskKey(taskKey)
          },
        )
      }}
      onUndo={() => onUndo(location.id)}
      onImageClick={onImageClick}
      onSelectImage={onSelectImage}
      onImageEdit={(locationId, imageIndex) =>
        onImageEdit(locationId, imageIndex, location.name)
      }
      onCopyFromGlobal={() => onCopyFromGlobal(location.id)}
      activeTaskKeys={activeTaskKeys}
      onClearTaskKey={onClearTaskKey}
      projectId={projectId}
      onConfirmSelection={onConfirmSelection}
      stateMessages={labels.stateMessages}
      headerLabels={labels.header}
      imageListLabels={labels.imageList}
      actionLabels={labels.actions}
      selectionLabels={labels.selection}
      overlayLabels={labels.overlay}
    />
  )
}
