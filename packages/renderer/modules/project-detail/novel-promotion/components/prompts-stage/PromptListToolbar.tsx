import TaskStatusInline from '@/components/task/TaskStatusInline'
import { AppIcon } from '@/components/ui/icons'
import type { PromptStageRuntime } from './hooks/usePromptStageActions'

interface PromptListToolbarProps {
  runtime: PromptStageRuntime
}

export default function PromptListToolbar({ runtime }: PromptListToolbarProps) {
  const {
    viewMode,
    onViewModeChange,
    onGenerateAllImages,
    isAnyTaskRunning,
    runningCount,
    batchTaskRunningState,
    onBack,
    shots,
    labels,
  } = runtime
  const toolbarLabels = labels.toolbar

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {onBack && (
          <button
            onClick={onBack}
            disabled={isAnyTaskRunning}
            className="glass-btn-base px-4 py-2 bg-[var(--glass-bg-muted)] text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-muted)] text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <AppIcon name="chevronLeft" className="w-4 h-4" />
            <span>{toolbarLabels.backLabel}</span>
          </button>
        )}
        <span className="text-sm text-[var(--glass-text-secondary)]">
          {toolbarLabels.panelsLabel}: {shots.length}
          {runningCount > 0 && (
            <span className="ml-2 text-[var(--glass-tone-info-fg)] font-medium">
              ({runningCount} {toolbarLabels.generatingLabel})
            </span>
          )}
        </span>
        <button
          onClick={onGenerateAllImages}
          disabled={isAnyTaskRunning}
          className="glass-btn-base px-4 py-2 bg-[var(--glass-tone-success-fg)] text-white hover:bg-[var(--glass-tone-success-fg)] text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isAnyTaskRunning ? (
            <TaskStatusInline state={batchTaskRunningState} className="text-white [&>span]:text-white [&_svg]:text-white" />
          ) : (
            toolbarLabels.generateAllLabel
          )}
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onViewModeChange('card')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'card' ? 'bg-[var(--glass-accent-from)] text-white' : 'bg-[var(--glass-bg-muted)] text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-muted)]'}`}
        >
          {toolbarLabels.previewLabel}
        </button>
        <button
          onClick={() => onViewModeChange('table')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-[var(--glass-accent-from)] text-white' : 'bg-[var(--glass-bg-muted)] text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-muted)]'}`}
        >
          {toolbarLabels.statusLabel}
        </button>
      </div>
    </div>
  )
}
