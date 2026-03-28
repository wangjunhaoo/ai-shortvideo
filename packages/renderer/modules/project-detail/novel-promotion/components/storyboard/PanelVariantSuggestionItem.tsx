'use client'

import TaskStatusInline from '@/components/task/TaskStatusInline'
import type { PanelVariantSuggestionItemProps } from './PanelVariantModalSuggestionList.types'

export default function PanelVariantSuggestionItem({
  labels,
  suggestion,
  selectedVariantId,
  isSubmittingVariantTask,
  variantTaskRunningState,
  onSelectVariant,
}: PanelVariantSuggestionItemProps) {
  const isSelected = selectedVariantId === suggestion.id
  const scoreLabel = labels.formatCreativeScore(suggestion.creative_score)

  return (
    <div
      className={`p-3 border rounded-lg transition-colors cursor-pointer ${
        isSelected
          ? 'border-[var(--glass-stroke-focus)] bg-[var(--glass-tone-info-bg)]'
          : 'border-[var(--glass-stroke-base)] hover:border-[var(--glass-stroke-focus)] hover:bg-[var(--glass-bg-muted)]'
      }`}
      onClick={() => !isSubmittingVariantTask && onSelectVariant(suggestion)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--glass-tone-warning-fg)]">
              {scoreLabel}
            </span>
            <h4 className="text-sm font-medium text-[var(--glass-text-primary)]">
              {suggestion.title}
            </h4>
          </div>
          <p className="text-xs text-[var(--glass-text-secondary)] mt-1">
            {suggestion.description}
          </p>
          <div className="flex gap-2 mt-1">
            <span className="text-xs text-[var(--glass-text-tertiary)]">
              {labels.shotTypeLabel} {suggestion.shot_type}
            </span>
            <span className="text-xs text-[var(--glass-text-tertiary)]">
              {labels.cameraMoveLabel} {suggestion.camera_move}
            </span>
          </div>
        </div>
        <button
          disabled={isSubmittingVariantTask}
          className={`glass-btn-base px-3 py-1 text-xs rounded-lg ${
            isSubmittingVariantTask && isSelected
              ? 'glass-btn-soft text-[var(--glass-text-tertiary)]'
              : 'glass-btn-primary text-white'
          }`}
        >
          {isSubmittingVariantTask && isSelected ? (
          <TaskStatusInline
            state={variantTaskRunningState}
            className="text-[var(--glass-text-tertiary)] [&>span]:text-[var(--glass-text-tertiary)] [&_svg]:text-[var(--glass-text-tertiary)]"
          />
        ) : (
            labels.selectLabel
          )}
        </button>
      </div>
    </div>
  )
}
