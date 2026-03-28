'use client'

import type { ScreenplayDisplayLabels, ScreenplaySceneContentItem } from './ScreenplayDisplay.types'

interface ScreenplayContentItemProps {
  item: ScreenplaySceneContentItem
  voiceoverLabel: ScreenplayDisplayLabels['scene']['voiceoverLabel']
}

export default function ScreenplayContentItem({
  item,
  voiceoverLabel,
}: ScreenplayContentItemProps) {
  if (item.type === 'action') {
    return (
      <p className="text-sm text-[var(--glass-text-secondary)] leading-relaxed">
        {item.text}
      </p>
    )
  }

  if (item.type === 'dialogue') {
    return (
      <div className="bg-[var(--glass-tone-warning-bg)]/60 border-l-2 border-[var(--glass-stroke-warning)] pl-2 py-1">
        <div>
          <span className="text-xs font-medium text-[var(--glass-tone-warning-fg)]">
            {item.character}
          </span>
          {item.parenthetical && (
            <span className="text-[var(--glass-tone-warning-fg)] ml-1">
              ({item.parenthetical})
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--glass-text-secondary)]">
          <span className="select-none text-[var(--glass-text-tertiary)]">
            &quot;
          </span>
          {item.lines}
          <span className="select-none text-[var(--glass-text-tertiary)]">
            &quot;
          </span>
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--glass-tone-info-bg)]/60 border-l-2 border-[var(--glass-stroke-focus)] pl-2 py-1">
      <span className="text-xs text-[var(--glass-tone-info-fg)]">
        {voiceoverLabel}
      </span>
      <p className="text-sm text-[var(--glass-text-secondary)] italic">
        {item.text}
      </p>
    </div>
  )
}
