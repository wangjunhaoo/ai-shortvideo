import TaskStatusInline from '@/components/task/TaskStatusInline'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { AppIcon } from '@/components/ui/icons'

interface NovelInputActionPanelProps {
  enableNarration: boolean
  onEnableNarrationChange?: (enabled: boolean) => void
  onNext: () => void
  hasContent: boolean
  isSubmittingTask: boolean
  isSwitchingStage: boolean
  labels: NovelInputActionPanelLabels
}

export interface NovelInputActionPanelLabels {
  narrationTitle: string
  narrationDescription: string
  nextLabel: string
  readyLabel: string
  pleaseInputLabel: string
}

export function NovelInputActionPanel({
  enableNarration,
  onEnableNarrationChange,
  onNext,
  hasContent,
  isSubmittingTask,
  isSwitchingStage,
  labels,
}: NovelInputActionPanelProps) {
  const stageSwitchingState = isSwitchingStage
    ? resolveTaskPresentationState({
        phase: 'processing',
        intent: 'generate',
        resource: 'text',
        hasOutput: false,
      })
    : null

  return (
    <div className="glass-surface p-6">
      {onEnableNarrationChange && (
        <div className="glass-surface-soft flex items-center justify-between p-4 rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] font-semibold text-sm">VO</span>
            <div>
              <div className="font-medium text-[var(--glass-text-primary)]">{labels.narrationTitle}</div>
              <div className="text-xs text-[var(--glass-text-tertiary)]">{labels.narrationDescription}</div>
            </div>
          </div>
          <button
            onClick={() => onEnableNarrationChange(!enableNarration)}
            className={`relative w-14 h-8 rounded-full transition-colors ${enableNarration ? 'bg-[var(--glass-accent-from)]' : 'bg-[var(--glass-stroke-strong)]'}`}
          >
            <span
              className={`absolute top-1 left-1 w-6 h-6 bg-[var(--glass-bg-surface)] rounded-full shadow-sm transition-transform ${enableNarration ? 'translate-x-6' : 'translate-x-0'}`}
            />
          </button>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!hasContent || isSubmittingTask || isSwitchingStage}
        className="glass-btn-base glass-btn-primary w-full py-4 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isSwitchingStage ? (
          <TaskStatusInline state={stageSwitchingState} className="text-white [&>span]:text-white [&_svg]:text-white" />
        ) : (
          <>
            <span>{labels.nextLabel}</span>
            <AppIcon name="arrowRight" className="w-5 h-5" />
          </>
        )}
      </button>
      <p className="text-center text-xs text-[var(--glass-text-tertiary)] mt-3">
        {hasContent ? labels.readyLabel : labels.pleaseInputLabel}
      </p>
    </div>
  )
}
