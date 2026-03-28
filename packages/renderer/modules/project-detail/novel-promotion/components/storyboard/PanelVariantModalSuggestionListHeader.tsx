'use client'

import TaskStatusInline from '@/components/task/TaskStatusInline'
import type { TaskPresentationState } from '@/lib/task/presentation'

interface PanelVariantModalSuggestionListHeaderProps {
  title: string
  reanalyzeLabel: string
  isAnalyzing: boolean
  suggestionsCount: number
  analyzeTaskRunningState: TaskPresentationState | null
  onReanalyze: () => void
}

export default function PanelVariantModalSuggestionListHeader({
  title,
  reanalyzeLabel,
  isAnalyzing,
  suggestionsCount,
  analyzeTaskRunningState,
  onReanalyze,
}: PanelVariantModalSuggestionListHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-medium text-[var(--glass-text-primary)] flex items-center gap-2">
        {title}
        {isAnalyzing && (
          <TaskStatusInline
            state={analyzeTaskRunningState}
            className="text-[var(--glass-tone-info-fg)] [&>span]:text-[var(--glass-tone-info-fg)] [&_svg]:text-[var(--glass-tone-info-fg)]"
          />
        )}
      </h3>
      {!isAnalyzing && suggestionsCount > 0 && (
        <button
          onClick={onReanalyze}
          className="text-xs text-[var(--glass-tone-info-fg)] hover:text-[var(--glass-text-primary)] flex items-center gap-1"
        >
          {reanalyzeLabel}
        </button>
      )}
    </div>
  )
}
