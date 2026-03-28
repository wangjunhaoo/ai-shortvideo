'use client'

import type { NovelPromotionClip } from '@/types/project'
import { AppIcon } from '@/components/ui/icons'
import ScreenplayDisplay from './ScreenplayDisplay'
import type { ScreenplayDisplayLabels } from './ScreenplayDisplay.types'

interface StoryboardGroupClipSectionLabels {
  stylePromptLabel: string
  sourceTextLabel: string
  screenplay: ScreenplayDisplayLabels
}

interface StoryboardGroupClipSectionProps {
  clip: NovelPromotionClip
  isExpanded: boolean
  labels: StoryboardGroupClipSectionLabels
  onToggleExpand: () => void
}

export default function StoryboardGroupClipSection({
  clip,
  isExpanded,
  labels,
  onToggleExpand,
}: StoryboardGroupClipSectionProps) {
  return (
    <div className="mb-4">
      <button
        onClick={onToggleExpand}
        className="glass-btn-base glass-btn-soft rounded-xl px-3 py-2 text-sm"
      >
        <AppIcon name="chevronRightMd" className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        <span>{clip.screenplay ? labels.stylePromptLabel : labels.sourceTextLabel}</span>
      </button>
      {isExpanded ? (
        <div className="mt-2 glass-surface-soft p-2">
          {clip.screenplay ? (
            <ScreenplayDisplay
              screenplay={clip.screenplay}
              originalContent={clip.content}
              labels={labels.screenplay}
            />
          ) : (
            <div className="whitespace-pre-wrap p-3 text-sm text-[var(--glass-text-secondary)]">
              {clip.content}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
