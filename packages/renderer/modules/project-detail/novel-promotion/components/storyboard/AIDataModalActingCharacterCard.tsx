'use client'

import type { ActingCharacter } from './AIDataModal.types'
import type { AIDataModalActingSectionLabels } from './AIDataModalFormPane.types'

interface AIDataModalActingCharacterCardProps {
  actingDescriptionLabel: AIDataModalActingSectionLabels['actingDescription']
  character: ActingCharacter
  index: number
  onActingCharacterChange: (
    index: number,
    field: keyof ActingCharacter,
    value: string,
  ) => void
}

export default function AIDataModalActingCharacterCard({
  actingDescriptionLabel,
  character,
  index,
  onActingCharacterChange,
}: AIDataModalActingCharacterCardProps) {
  return (
    <div className="p-3 bg-[var(--glass-tone-info-bg)] rounded-lg border border-[var(--glass-stroke-focus)]">
      <div className="text-xs font-medium text-[var(--glass-tone-info-fg)] mb-2">
        {character.name}
      </div>
      <div>
        <label className="block text-[10px] text-[var(--glass-text-tertiary)] mb-0.5">
          {actingDescriptionLabel}
        </label>
        <textarea
          value={character.acting || ''}
          onChange={(event) =>
            onActingCharacterChange(index, 'acting', event.target.value)
          }
          rows={2}
          className="w-full px-2 py-1 border border-[var(--glass-stroke-focus)] rounded text-xs resize-none focus:ring-2 focus:ring-[var(--glass-tone-info-fg)] focus:border-[var(--glass-stroke-focus)]"
        />
      </div>
    </div>
  )
}
