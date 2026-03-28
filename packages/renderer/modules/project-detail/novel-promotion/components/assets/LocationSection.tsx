'use client'
import type { ComponentProps } from 'react'

/**
 * LocationSection - 场景资产区块组件
 * 从 AssetsStage.tsx 提取，负责场景列表的展示和操作
 *
 * 🔥 V6.5 重构：内部直接订阅 useProjectAssets，消除 props drilling
 */

import { Location } from '@/types/project'
import { useProjectAssets } from '@renderer/hooks/useRendererProjectQueries'
import { LocationSectionHeader } from './location-section/LocationSectionHeader'
import { LocationGridItem } from './location-section/LocationGridItem'

interface LocationSectionLabels {
    header: {
        sectionTitle: string
        sectionCountLabel: (count: number) => string
        addLocationLabel: string
    }
    card: ComponentProps<typeof LocationGridItem>['labels']
}

interface LocationSectionProps {
    projectId: string
    activeTaskKeys: Set<string>
    onClearTaskKey: (key: string) => void
    onRegisterTransientTaskKey: (key: string) => void
    onAddLocation: () => void
    onDeleteLocation: (locationId: string) => void
    onEditLocation: (location: Location) => void
    handleGenerateImage: (type: 'character' | 'location', id: string, appearanceId?: string, count?: number) => Promise<void>
    onSelectImage: (locationId: string, imageIndex: number | null) => void
    onConfirmSelection: (locationId: string) => void
    onRegenerateSingle: (locationId: string, imageIndex: number) => Promise<void>
    onRegenerateGroup: (locationId: string, count?: number) => Promise<void>
    onUndo: (locationId: string) => void
    onImageClick: (imageUrl: string) => void
    onImageEdit: (locationId: string, imageIndex: number, locationName: string) => void
    onCopyFromGlobal: (locationId: string) => void
    labels: LocationSectionLabels
}

export default function LocationSection({
    projectId,
    activeTaskKeys,
    onClearTaskKey,
    onRegisterTransientTaskKey,
    onAddLocation,
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
}: LocationSectionProps) {
    const { data: assets } = useProjectAssets(projectId)
    const locations: Location[] = assets?.locations ?? []

    return (
        <div className="glass-surface p-6">
            <LocationSectionHeader count={locations.length} onAddLocation={onAddLocation} labels={labels.header} />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-6">
                {locations.map((location) => (
                    <LocationGridItem
                        key={location.id}
                        projectId={projectId}
                        location={location}
                        activeTaskKeys={activeTaskKeys}
                        onClearTaskKey={onClearTaskKey}
                        onRegisterTransientTaskKey={onRegisterTransientTaskKey}
                        onDeleteLocation={onDeleteLocation}
                        onEditLocation={onEditLocation}
                        handleGenerateImage={handleGenerateImage}
                        onSelectImage={onSelectImage}
                        onConfirmSelection={onConfirmSelection}
                        onRegenerateSingle={onRegenerateSingle}
                        onRegenerateGroup={onRegenerateGroup}
                        onUndo={onUndo}
                        onImageClick={onImageClick}
                        onImageEdit={onImageEdit}
                        onCopyFromGlobal={onCopyFromGlobal}
                        labels={labels.card}
                    />
                ))}
            </div>
        </div>
    )
}
