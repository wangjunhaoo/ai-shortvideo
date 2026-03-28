'use client'

import TaskStatusInline from '@/components/task/TaskStatusInline'
import { AppIcon } from '@/components/ui/icons'
import type { TaskPresentationState } from '@/lib/task/presentation'

interface CharacterSectionHeaderLabels {
  sectionTitle: string
  sectionCountLabel: (characterCount: number, appearanceCount: number) => string
  addCharacterLabel: string
}

interface CharacterSectionHeaderProps {
  isAnalyzingAssets: boolean
  analyzingAssetsState: TaskPresentationState | null
  characterCount: number
  appearanceCount: number
  onAddCharacter: () => void
  labels: CharacterSectionHeaderLabels
}

export function CharacterSectionHeader({
  isAnalyzingAssets,
  analyzingAssetsState,
  characterCount,
  appearanceCount,
  onAddCharacter,
  labels,
}: CharacterSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--glass-bg-muted)] text-[var(--glass-text-secondary)]">
          <AppIcon name="user" className="h-5 w-5" />
        </span>
        <h3 className="text-lg font-bold text-[var(--glass-text-primary)]">
          {labels.sectionTitle}
        </h3>
        {isAnalyzingAssets && (
          <span className="px-2 py-1 text-xs bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] rounded-lg flex items-center gap-1">
            <TaskStatusInline state={analyzingAssetsState} />
          </span>
        )}
        <span className="text-sm text-[var(--glass-text-tertiary)] bg-[var(--glass-bg-muted)]/50 px-2 py-1 rounded-lg">
          {labels.sectionCountLabel(characterCount, appearanceCount)}
        </span>
      </div>
      <button
        onClick={onAddCharacter}
        className="glass-btn-base glass-btn-primary flex items-center gap-2 px-4 py-2 font-medium"
      >
        + {labels.addCharacterLabel}
      </button>
    </div>
  )
}
