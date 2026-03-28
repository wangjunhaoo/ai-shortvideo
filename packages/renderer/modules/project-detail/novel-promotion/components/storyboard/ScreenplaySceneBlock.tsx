'use client'

import ScreenplayContentItem from './ScreenplayContentItem'
import type { ScreenplayDisplayLabels, ScreenplayScene } from './ScreenplayDisplay.types'

interface ScreenplaySceneBlockProps {
  labels: ScreenplayDisplayLabels['scene']
  scene: ScreenplayScene
  sceneLabel: string
}

export default function ScreenplaySceneBlock({
  labels,
  scene,
  sceneLabel,
}: ScreenplaySceneBlockProps) {
  const headingText =
    typeof scene.heading === 'string'
      ? scene.heading
      : `${scene.heading.int_ext} · ${scene.heading.location} · ${scene.heading.time}`

  return (
    <div className="border-l-2 border-[var(--glass-stroke-focus)] pl-3 space-y-2">
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="font-bold text-[var(--glass-tone-info-fg)] bg-[var(--glass-tone-info-bg)] px-2 py-0.5 rounded">
          {sceneLabel}
        </span>
        <span className="text-[var(--glass-text-tertiary)]">{headingText}</span>
      </div>

      {scene.description && (
        <div className="text-xs text-[var(--glass-text-tertiary)] italic bg-[var(--glass-bg-muted)]/70 px-2 py-1 rounded">
          {scene.description}
        </div>
      )}

      {scene.characters && scene.characters.length > 0 && (
        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-[10px] text-[var(--glass-text-tertiary)]">
            {labels.charactersLabel}
          </span>
          {scene.characters.map((name, index) => (
            <span
              key={`${name}-${index}`}
              className="text-[10px] text-[var(--glass-text-secondary)] bg-[var(--glass-bg-muted)] px-1.5 py-0.5 rounded"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        {scene.content.map((item, itemIndex) => (
          <ScreenplayContentItem
            key={itemIndex}
            item={item}
            voiceoverLabel={labels.voiceoverLabel}
          />
        ))}
      </div>
    </div>
  )
}
