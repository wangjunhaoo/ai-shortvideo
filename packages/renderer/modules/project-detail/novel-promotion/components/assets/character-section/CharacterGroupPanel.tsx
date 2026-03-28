'use client'

import { logInfo as _ulogInfo } from '@/lib/logging/core'
import { PRIMARY_APPEARANCE_INDEX } from '@/lib/constants'
import type { Character, CharacterAppearance } from '@/types/project'
import CharacterCard from '../CharacterCard'
import { AppIcon } from '@/components/ui/icons'
import type {
  CharacterCardActionsLabels,
  CharacterCardCompactLabels,
  CharacterCardGalleryLabels,
  CharacterCardHeaderLabels,
  CharacterCardOverlayLabels,
  CharacterCardSelectionLabels,
  CharacterCardStateMessages,
} from '../character-card/types'
import type { VoiceSettingsLabels } from '../VoiceSettings'

interface CharacterGroupPanelLabels {
  assetCountLabel: (count: number) => string
  copyFromGlobalLabel: string
  deleteLabel: string
  card: {
    stateMessages: CharacterCardStateMessages
    header: CharacterCardHeaderLabels
    gallery: CharacterCardGalleryLabels
    actions: CharacterCardActionsLabels
    selection: CharacterCardSelectionLabels
    overlay: CharacterCardOverlayLabels
    compact: CharacterCardCompactLabels
    voiceSettings: VoiceSettingsLabels
  }
}

interface CharacterGroupPanelProps {
  projectId: string
  character: Character
  highlighted: boolean
  activeTaskKeys: Set<string>
  onClearTaskKey: (key: string) => void
  onRegisterTransientTaskKey: (key: string) => void
  onDeleteCharacter: (characterId: string) => void
  onDeleteAppearance: (characterId: string, appearanceId: string) => void
  onEditAppearance: (
    characterId: string,
    characterName: string,
    appearance: CharacterAppearance,
    introduction?: string | null,
  ) => void
  handleGenerateImage: (
    type: 'character' | 'location',
    id: string,
    appearanceId?: string,
    count?: number,
  ) => Promise<void>
  onSelectImage: (characterId: string, appearanceId: string, imageIndex: number | null) => void
  onConfirmSelection: (characterId: string, appearanceId: string) => void
  onRegenerateSingle: (
    characterId: string,
    appearanceId: string,
    imageIndex: number,
  ) => Promise<void>
  onRegenerateGroup: (
    characterId: string,
    appearanceId: string,
    count?: number,
  ) => Promise<void>
  onUndo: (characterId: string, appearanceId: string) => void
  onImageClick: (imageUrl: string) => void
  onImageEdit: (
    characterId: string,
    appearanceId: string,
    imageIndex: number,
    characterName: string,
  ) => void
  onVoiceChange: (characterId: string, customVoiceUrl: string) => void
  onVoiceDesign: (characterId: string, characterName: string) => void
  onVoiceSelectFromHub: (characterId: string) => void
  onCopyFromGlobal: (characterId: string) => void
  getAppearances: (character: Character) => CharacterAppearance[]
  labels: CharacterGroupPanelLabels
}

export function CharacterGroupPanel({
  projectId,
  character,
  highlighted,
  activeTaskKeys,
  onClearTaskKey,
  onRegisterTransientTaskKey,
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
}: CharacterGroupPanelProps) {
  const appearances = getAppearances(character)
  const sortedAppearances = [...appearances].sort(
    (left, right) => left.appearanceIndex - right.appearanceIndex,
  )
  const primaryAppearance =
    sortedAppearances.find(
      (appearance) => appearance.appearanceIndex === PRIMARY_APPEARANCE_INDEX,
    ) || sortedAppearances[0]

  const primaryImageUrl =
    primaryAppearance?.selectedIndex !== null &&
    primaryAppearance?.selectedIndex !== undefined
      ? primaryAppearance?.imageUrls?.[primaryAppearance.selectedIndex] ||
        primaryAppearance?.imageUrl
      : primaryAppearance?.imageUrl ||
        (primaryAppearance?.imageUrls && primaryAppearance.imageUrls.length > 0
          ? primaryAppearance.imageUrls[0]
          : null)
  const primarySelected = !!primaryImageUrl

  return (
    <div
      id={`project-character-${character.id}`}
      className={`glass-surface rounded-xl p-4 scroll-mt-24 transition-all duration-700 ${
        highlighted
          ? 'ring-2 ring-[var(--glass-focus-ring)] bg-[var(--glass-tone-info-bg)]/40'
          : ''
      }`}
    >
      <div className="flex items-center justify-between border-b border-[var(--glass-stroke-base)] pb-2">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-[var(--glass-text-primary)]">
            {character.name}
          </h3>
          <span className="text-xs text-[var(--glass-text-tertiary)]">
            {labels.assetCountLabel(sortedAppearances.length)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCopyFromGlobal(character.id)}
            className="text-xs text-[var(--glass-tone-info-fg)] hover:text-[var(--glass-tone-info-fg)] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[var(--glass-tone-info-bg)] transition-colors"
          >
            <AppIcon name="copy" className="w-4 h-4" />
            {labels.copyFromGlobalLabel}
          </button>
          <button
            onClick={() => onDeleteCharacter(character.id)}
            className="text-xs text-[var(--glass-tone-danger-fg)] hover:text-[var(--glass-tone-danger-fg)] flex items-center gap-1"
          >
            <AppIcon name="trash" className="w-4 h-4" />
            {labels.deleteLabel}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sortedAppearances.map((appearance) => {
          const isPrimary =
            appearance.appearanceIndex ===
            (primaryAppearance?.appearanceIndex ?? PRIMARY_APPEARANCE_INDEX)

          return (
            <CharacterCard
              key={`${character.id}-${appearance.appearanceIndex}`}
              character={character}
              appearance={appearance}
              onEdit={() =>
                onEditAppearance(
                  character.id,
                  character.name,
                  appearance,
                  character.introduction,
                )
              }
              onDelete={() => onDeleteCharacter(character.id)}
              onDeleteAppearance={() =>
                appearance.id && onDeleteAppearance(character.id, appearance.id)
              }
              onRegenerate={(count) => {
                const imageUrls = appearance.imageUrls || []
                const validImageCount = imageUrls.filter((url) => !!url).length

                _ulogInfo('[CharacterSection] 重新生成判断:', {
                  characterName: character.name,
                  appearanceIndex: appearance.appearanceIndex,
                  imageUrls,
                  validImageCount,
                  selectedIndex: appearance.selectedIndex,
                })

                if (validImageCount === 1) {
                  const selectedIndex = appearance.selectedIndex ?? 0
                  const taskKey = `character-${character.id}-${appearance.appearanceIndex}-${selectedIndex}`
                  _ulogInfo('[CharacterSection] 调用单张重新生成, imageIndex:', selectedIndex)
                  onRegisterTransientTaskKey(taskKey)
                  void onRegenerateSingle(character.id, appearance.id, selectedIndex).catch(
                    () => {
                      onClearTaskKey(taskKey)
                    },
                  )
                } else {
                  const taskKey = `character-${character.id}-${appearance.appearanceIndex}-group`
                  _ulogInfo('[CharacterSection] 调用整组重新生成')
                  onRegisterTransientTaskKey(taskKey)
                  void onRegenerateGroup(character.id, appearance.id, count).catch(() => {
                    onClearTaskKey(taskKey)
                  })
                }
              }}
              onGenerate={(count) => {
                const taskKey = `character-${character.id}-${appearance.appearanceIndex}-group`
                onRegisterTransientTaskKey(taskKey)
                void handleGenerateImage(
                  'character',
                  character.id,
                  appearance.id,
                  count,
                ).catch(() => {
                  onClearTaskKey(taskKey)
                })
              }}
              onUndo={() => onUndo(character.id, appearance.id)}
              onImageClick={onImageClick}
              showDeleteButton={true}
              appearanceCount={sortedAppearances.length}
              onSelectImage={onSelectImage}
              activeTaskKeys={activeTaskKeys}
              onClearTaskKey={onClearTaskKey}
              onImageEdit={(characterId, _appearanceId, imageIndex) =>
                onImageEdit(characterId, appearance.id, imageIndex, character.name)
              }
              isPrimaryAppearance={isPrimary}
              primaryAppearanceSelected={primarySelected}
              projectId={projectId}
              onConfirmSelection={onConfirmSelection}
              onVoiceChange={(characterId: string, customVoiceUrl?: string) =>
                customVoiceUrl && onVoiceChange(characterId, customVoiceUrl)
              }
              onVoiceDesign={onVoiceDesign}
              onVoiceSelectFromHub={onVoiceSelectFromHub}
              stateMessages={labels.card.stateMessages}
              headerLabels={labels.card.header}
              galleryLabels={labels.card.gallery}
              actionLabels={labels.card.actions}
              selectionLabels={labels.card.selection}
              overlayLabels={labels.card.overlay}
              compactLabels={labels.card.compact}
              voiceSettingsLabels={labels.card.voiceSettings}
            />
          )
        })}
      </div>
    </div>
  )
}
