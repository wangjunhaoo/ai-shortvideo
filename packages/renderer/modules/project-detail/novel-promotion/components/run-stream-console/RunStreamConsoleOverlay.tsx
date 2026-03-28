'use client'

import LLMStageStreamCard, { type LLMStageViewItem } from '@/components/llm-console/LLMStageStreamCard'
import type { RunStreamState } from './types'

interface RunStreamConsoleOverlayProps {
  stream: RunStreamState
  minimized: boolean
  onMinimizedChange: (next: boolean) => void
  hideMinimizedBadge?: boolean
  defaultStageId: string
  defaultTitle: string
  subtitle: string
  runningBadgeLabel: string
  minimizedBadgeClassName: string
  stopLabel: string
  minimizeLabel: string
}

export function RunStreamConsoleOverlay({
  stream,
  minimized,
  onMinimizedChange,
  hideMinimizedBadge,
  defaultStageId,
  defaultTitle,
  subtitle,
  runningBadgeLabel,
  minimizedBadgeClassName,
  stopLabel,
  minimizeLabel,
}: RunStreamConsoleOverlayProps) {
  const active =
    stream.isRunning ||
    stream.isRecoveredRunning ||
    stream.status === 'running'

  const showConsole =
    stream.isVisible &&
    (stream.stages.length > 0 || !!stream.errorMessage)

  const fallbackStatus: LLMStageViewItem['status'] =
    stream.status === 'failed' ? 'failed' : 'processing'

  const stages = stream.stages.length > 0
    ? stream.stages
    : [{
        id: defaultStageId,
        title: defaultTitle,
        status: fallbackStatus,
        progress: 0,
        subtitle: stream.errorMessage || undefined,
      }]

  const activeStage = stream.activeStepId
    ? stages.find((stage) => stage.id === stream.activeStepId) || null
    : null

  const cardTitle = activeStage?.title || defaultTitle
  const selectedStageId = stream.selectedStep?.id || stream.activeStepId || null
  const selectedStage = selectedStageId
    ? stages.find((stage) => stage.id === selectedStageId) || null
    : null

  const showCursor =
    stream.isRunning &&
    stream.selectedStep?.id === stream.activeStepId &&
    selectedStage?.status === 'processing'

  const handleRetryStepById = async (stepId: string) => {
    const input = typeof window !== 'undefined'
      ? window.prompt('可选：输入重试模型（留空使用当前模型）')
      : null
    const modelOverride = typeof input === 'string' ? input.trim() : ''
    await stream.retryStep({
      stepId,
      modelOverride: modelOverride || undefined,
      reason: 'user_retry_from_console',
    })
  }

  return (
    <>
      {!hideMinimizedBadge && showConsole && minimized && active && (
        <button
          type="button"
          onClick={() => onMinimizedChange(false)}
          className={minimizedBadgeClassName}
        >
          {runningBadgeLabel}
        </button>
      )}

      {showConsole && !minimized && (
        <div className="fixed inset-0 z-120 glass-overlay backdrop-blur-sm">
          <div className="mx-auto mt-4 h-[calc(100vh-2rem)] w-[min(96vw,1400px)]">
            <LLMStageStreamCard
              title={cardTitle}
              subtitle={subtitle}
              stages={stages}
              activeStageId={stream.activeStepId || stages[stages.length - 1]?.id || ''}
              selectedStageId={stream.selectedStep?.id || undefined}
              onSelectStage={stream.selectStep}
              onRetryStage={(stepId) => {
                void handleRetryStepById(stepId)
              }}
              outputText={stream.outputText}
              activeMessage={stream.activeMessage}
              overallProgress={stream.overallProgress}
              showCursor={showCursor}
              autoScroll={stream.selectedStep?.id === stream.activeStepId}
              errorMessage={stream.errorMessage}
              topRightAction={(
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={stream.reset}
                    className="glass-btn-base glass-btn-secondary rounded-lg px-3 py-1.5 text-xs"
                  >
                    {stopLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => onMinimizedChange(true)}
                    className="glass-btn-base glass-btn-secondary rounded-lg px-3 py-1.5 text-xs"
                  >
                    {minimizeLabel}
                  </button>
                </div>
              )}
            />
          </div>
        </div>
      )}
    </>
  )
}
