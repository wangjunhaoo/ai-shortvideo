'use client'
import { useMemo } from 'react'
import type { ComponentProps } from 'react'
import { resolveTaskPresentationState } from '@/lib/task/presentation'

/**
 * CharacterSection - 角色资产区块组件
 * 从 AssetsStage.tsx 提取，负责角色列表的展示和操作
 *
 * 🔥 V6.5 重构：内部直接订阅 useProjectAssets，消除 props drilling
 */

import { Character, CharacterAppearance } from '@/types/project'
import { useProjectAssets } from '@renderer/hooks/useRendererProjectQueries'
import { CharacterSectionHeader } from './character-section/CharacterSectionHeader'
import { CharacterGroupPanel } from './character-section/CharacterGroupPanel'
import { useFocusedCharacterScroll } from './character-section/useFocusedCharacterScroll'

interface CharacterSectionLabels {
    header: {
        sectionTitle: string
        sectionCountLabel: (characterCount: number, appearanceCount: number) => string
        addCharacterLabel: string
    }
    group: ComponentProps<typeof CharacterGroupPanel>['labels']
}

interface CharacterSectionProps {
    projectId: string
    focusCharacterId?: string | null
    focusCharacterRequestId?: number
    activeTaskKeys: Set<string>
    onClearTaskKey: (key: string) => void
    onRegisterTransientTaskKey: (key: string) => void
    isAnalyzingAssets: boolean
    onAddCharacter: () => void
    onDeleteCharacter: (characterId: string) => void
    onDeleteAppearance: (characterId: string, appearanceId: string) => void
    onEditAppearance: (characterId: string, characterName: string, appearance: CharacterAppearance, introduction?: string | null) => void
    handleGenerateImage: (type: 'character' | 'location', id: string, appearanceId?: string, count?: number) => Promise<void>
    onSelectImage: (characterId: string, appearanceId: string, imageIndex: number | null) => void
    onConfirmSelection: (characterId: string, appearanceId: string) => void
    onRegenerateSingle: (characterId: string, appearanceId: string, imageIndex: number) => Promise<void>
    onRegenerateGroup: (characterId: string, appearanceId: string, count?: number) => Promise<void>
    onUndo: (characterId: string, appearanceId: string) => void
    onImageClick: (imageUrl: string) => void
    onImageEdit: (characterId: string, appearanceId: string, imageIndex: number, characterName: string) => void
    onVoiceChange: (characterId: string, customVoiceUrl: string) => void
    onVoiceDesign: (characterId: string, characterName: string) => void
    onVoiceSelectFromHub: (characterId: string) => void
    onCopyFromGlobal: (characterId: string) => void
    getAppearances: (character: Character) => CharacterAppearance[]
    labels: CharacterSectionLabels
}

export default function CharacterSection({
    projectId,
    focusCharacterId = null,
    focusCharacterRequestId = 0,
    activeTaskKeys,
    onClearTaskKey,
    onRegisterTransientTaskKey,
    isAnalyzingAssets,
    onAddCharacter,
    onDeleteCharacter,
    onDeleteAppearance,
    onEditAppearance,
    handleGenerateImage,
    onSelectImage,
    onConfirmSelection,
    onRegenerateSingle,
    onRegenerateGroup,
    onUndo,
    onImageClick,
    onImageEdit,
    onVoiceChange,
    onVoiceDesign,
    onVoiceSelectFromHub,
    onCopyFromGlobal,
    getAppearances,
    labels,
}: CharacterSectionProps) {
    const analyzingAssetsState = isAnalyzingAssets
        ? resolveTaskPresentationState({
            phase: 'processing',
            intent: 'generate',
            resource: 'image',
            hasOutput: false,
        })
        : null

    const { data: assets } = useProjectAssets(projectId)
    const characters: Character[] = useMemo(() => assets?.characters ?? [], [assets?.characters])
    const totalAppearances = characters.reduce((sum, char) => sum + (char.appearances?.length || 0), 0)
    const { highlightedCharacterId } = useFocusedCharacterScroll({
        characters,
        focusCharacterId,
        focusCharacterRequestId,
    })

    return (
        <div className="glass-surface p-6">
            <CharacterSectionHeader
                isAnalyzingAssets={isAnalyzingAssets}
                analyzingAssetsState={analyzingAssetsState}
                characterCount={characters.length}
                appearanceCount={totalAppearances}
                onAddCharacter={onAddCharacter}
                labels={labels.header}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {characters.map((character) => (
                    <CharacterGroupPanel
                        key={character.id}
                        projectId={projectId}
                        character={character}
                        highlighted={highlightedCharacterId === character.id}
                        activeTaskKeys={activeTaskKeys}
                        onClearTaskKey={onClearTaskKey}
                        onRegisterTransientTaskKey={onRegisterTransientTaskKey}
                        onDeleteCharacter={onDeleteCharacter}
                        onDeleteAppearance={onDeleteAppearance}
                        onEditAppearance={onEditAppearance}
                        handleGenerateImage={handleGenerateImage}
                        onSelectImage={onSelectImage}
                        onConfirmSelection={onConfirmSelection}
                        onRegenerateSingle={onRegenerateSingle}
                        onRegenerateGroup={onRegenerateGroup}
                        onUndo={onUndo}
                        onImageClick={onImageClick}
                        onImageEdit={onImageEdit}
                        onVoiceChange={onVoiceChange}
                        onVoiceDesign={onVoiceDesign}
                        onVoiceSelectFromHub={onVoiceSelectFromHub}
                        onCopyFromGlobal={onCopyFromGlobal}
                        getAppearances={getAppearances}
                        labels={labels.group}
                    />
                ))}
            </div>
        </div>
    )
}
