'use client'

import type { ReactNode } from 'react'
import type { CharacterCardHeaderLabels } from './types'

type CharacterCardHeaderProps =
  | {
    mode: 'selection'
    characterName: string
    changeReason: string
    isPrimaryAppearance: boolean
    selectedIndex: number | null
    labels: CharacterCardHeaderLabels
    actions: ReactNode
  }
  | {
    mode: 'compact'
    characterName: string
    changeReason: string
    labels?: CharacterCardHeaderLabels
    actions: ReactNode
  }

export default function CharacterCardHeader(props: CharacterCardHeaderProps) {
  if (props.mode === 'selection') {
    return (
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-[var(--glass-text-primary)]">{props.characterName}</span>
            <span className="text-xs text-[var(--glass-text-tertiary)] bg-[var(--glass-bg-muted)] px-2 py-0.5 rounded">{props.changeReason}</span>
            {props.isPrimaryAppearance ? (
              <span className="text-xs text-[var(--glass-tone-success-fg)] bg-[var(--glass-tone-success-bg)] px-2 py-0.5 rounded">{props.labels.primaryLabel}</span>
            ) : (
              <span className="text-xs text-[var(--glass-tone-info-fg)] bg-[var(--glass-tone-info-bg)] px-2 py-0.5 rounded">{props.labels.secondaryLabel}</span>
            )}
          </div>
          <div className="text-xs text-[var(--glass-text-tertiary)]">
            {props.selectedIndex !== null
              ? props.labels.optionSelectedLabel(props.selectedIndex + 1)
              : props.labels.selectFirstLabel}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">{props.actions}</div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-1">
        <div className="text-xs font-semibold text-[var(--glass-text-primary)] truncate" title={props.characterName}>
          {props.characterName}
        </div>
        <div className="flex items-center gap-1">{props.actions}</div>
      </div>
      <div className="text-xs text-[var(--glass-text-secondary)] truncate" title={props.changeReason}>
        {props.changeReason}
      </div>
    </div>
  )
}
