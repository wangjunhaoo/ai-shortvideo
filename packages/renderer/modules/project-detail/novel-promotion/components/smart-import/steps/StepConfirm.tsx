'use client'

import TaskStatusInline from '@/components/task/TaskStatusInline'
import type { TaskPresentationState } from '@/lib/task/presentation'
import type { SplitEpisode, StepConfirmLabels } from '../types'

interface StepConfirmProps {
  episodes: SplitEpisode[]
  saving: boolean
  savingTaskState: TaskPresentationState | null
  onReanalyze: () => void
  onConfirm: () => void
  onConfirmWithGlobalAnalysis: () => void
  labels: StepConfirmLabels
}

export default function StepConfirm({
  episodes,
  saving,
  savingTaskState,
  onReanalyze,
  onConfirm,
  onConfirmWithGlobalAnalysis,
  labels,
}: StepConfirmProps) {
  return (
    <div className="bg-[var(--glass-bg-surface)] rounded-2xl border border-[var(--glass-stroke-base)] p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">{labels.title}</h2>
          <p className="text-[var(--glass-text-secondary)]">
            {labels.episodeCountLabel(episodes.length)}，
            {labels.totalWordsLabel(episodes.reduce((sum, ep) => sum + ep.wordCount, 0).toLocaleString())}
            <span className="text-[var(--glass-tone-success-fg)] ml-2">{labels.autoSavedLabel}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onReanalyze}
            className="px-5 py-2.5 border border-[var(--glass-stroke-strong)] rounded-lg font-medium hover:bg-[var(--glass-bg-muted)] transition-colors duration-200"
          >
            {labels.reanalyzeLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-5 py-2.5 bg-[var(--glass-accent-from)] text-white rounded-lg font-medium hover:bg-[var(--glass-accent-to)] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <TaskStatusInline state={savingTaskState} className="text-white [&>span]:sr-only [&_svg]:text-white" />}
            {saving ? labels.savingLabel : labels.confirmLabel}
          </button>
          {episodes.length > 1 && (
            <button
              onClick={onConfirmWithGlobalAnalysis}
              disabled={saving}
              className="glass-btn-base glass-btn-primary px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <TaskStatusInline state={savingTaskState} className="text-white [&>span]:sr-only [&_svg]:text-white" />}
              {labels.confirmAndAnalyzeLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
