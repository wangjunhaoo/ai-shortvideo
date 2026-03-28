'use client'

import type { AIDataModalBasicSectionLabels } from './AIDataModalFormPane.types'

interface AIDataModalBasicSceneSummaryProps {
  labels: Pick<
    AIDataModalBasicSectionLabels,
    'scene' | 'notSelected' | 'characters' | 'none'
  >
  location: string | null
  characters: string[]
}

export default function AIDataModalBasicSceneSummary({
  labels,
  location,
  characters,
}: AIDataModalBasicSceneSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">
          {labels.scene}
        </label>
        <div className="px-3 py-2 bg-[var(--glass-bg-muted)] border border-[var(--glass-stroke-base)] rounded-lg text-sm text-[var(--glass-text-secondary)]">
          {location || labels.notSelected}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">
          {labels.characters}
        </label>
        <div className="px-3 py-2 bg-[var(--glass-bg-muted)] border border-[var(--glass-stroke-base)] rounded-lg text-sm text-[var(--glass-text-secondary)]">
          {characters.length > 0 ? characters.join('、') : labels.none}
        </div>
      </div>
    </div>
  )
}
