'use client'

import TaskStatusInline from '@/components/task/TaskStatusInline'
import { AppIcon } from '@/components/ui/icons'
import { GlassButton } from '@/components/ui/primitives'
import type { StoryboardGroupGenerateAllButtonProps } from './StoryboardGroupActions.types'

export default function StoryboardGroupGenerateAllButton({
  title,
  label,
  pendingCount,
  currentRunningCount,
  panelTaskRunningState,
  onGenerateAllIndividually,
}: StoryboardGroupGenerateAllButtonProps) {
  if (pendingCount <= 0) {
    return null
  }

  return (
    <GlassButton
      variant="primary"
      size="sm"
      onClick={onGenerateAllIndividually}
      disabled={currentRunningCount > 0}
      title={title}
    >
      {currentRunningCount > 0 ? (
        <TaskStatusInline state={panelTaskRunningState} />
      ) : (
        <>
          <AppIcon name="plus" className="h-3 w-3" />
          <span>{label}</span>
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-white/25 text-white">
            {pendingCount}
          </span>
        </>
      )}
    </GlassButton>
  )
}
