'use client'

import type {
  AIDataModalPhotographySectionLabels,
  AIDataModalPhotographySectionProps,
} from './AIDataModalFormPane.types'

type AIDataModalPhotographyCharactersProps = Pick<
  AIDataModalPhotographySectionProps,
  'photographyRules' | 'onPhotographyCharacterChange'
> & {
  labels: Pick<
    AIDataModalPhotographySectionLabels,
    'characterPosition' | 'position' | 'posture' | 'facing'
  >
}

export default function AIDataModalPhotographyCharacters({
  labels,
  photographyRules,
  onPhotographyCharacterChange,
}: AIDataModalPhotographyCharactersProps) {
  if (!photographyRules?.characters || photographyRules.characters.length === 0) {
    return null
  }

  return (
    <div>
      <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-2">
        {labels.characterPosition}
      </label>
      <div className="space-y-3">
        {photographyRules.characters.map((character, index) => (
          <div
            key={index}
            className="p-3 bg-[var(--glass-bg-muted)] rounded-lg border border-[var(--glass-stroke-base)]"
          >
            <div className="text-xs font-medium text-[var(--glass-tone-info-fg)] mb-2">
              {character.name}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-[var(--glass-text-tertiary)] mb-0.5">
                  {labels.position}
                </label>
                <input
                  type="text"
                  value={character.screen_position || ''}
                  onChange={(event) =>
                    onPhotographyCharacterChange(
                      index,
                      'screen_position',
                      event.target.value,
                    )
                  }
                  className="w-full px-2 py-1 border border-[var(--glass-stroke-base)] rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--glass-text-tertiary)] mb-0.5">
                  {labels.posture}
                </label>
                <input
                  type="text"
                  value={character.posture || ''}
                  onChange={(event) =>
                    onPhotographyCharacterChange(
                      index,
                      'posture',
                      event.target.value,
                    )
                  }
                  className="w-full px-2 py-1 border border-[var(--glass-stroke-base)] rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--glass-text-tertiary)] mb-0.5">
                  {labels.facing}
                </label>
                <input
                  type="text"
                  value={character.facing || ''}
                  onChange={(event) =>
                    onPhotographyCharacterChange(
                      index,
                      'facing',
                      event.target.value,
                    )
                  }
                  className="w-full px-2 py-1 border border-[var(--glass-stroke-base)] rounded text-xs"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
