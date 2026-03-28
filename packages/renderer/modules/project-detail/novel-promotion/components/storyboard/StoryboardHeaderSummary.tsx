'use client'

import { GlassChip } from '@/components/ui/primitives'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import type { StoryboardHeaderSummaryProps } from './StoryboardHeader.types'

export default function StoryboardHeaderSummary({
  title,
  segmentsCountLabel,
  panelsCountLabel,
  concurrencyLimitLabel,
  runningCount,
  storyboardTaskRunningState,
}: StoryboardHeaderSummaryProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[var(--glass-text-primary)]">
          {title}
        </h3>
        <p className="text-sm text-[var(--glass-text-secondary)]">
          {segmentsCountLabel}
          {panelsCountLabel}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {runningCount > 0 ? (
          <GlassChip
            tone="info"
            icon={<span className="h-2 w-2 animate-pulse rounded-full bg-current" />}
          >
            <span className="inline-flex items-center gap-1.5">
              <TaskStatusInline state={storyboardTaskRunningState} />
              <span>({runningCount})</span>
            </span>
          </GlassChip>
        ) : null}
        <GlassChip tone="neutral">
          {concurrencyLimitLabel}
        </GlassChip>
      </div>
    </div>
  )
}
