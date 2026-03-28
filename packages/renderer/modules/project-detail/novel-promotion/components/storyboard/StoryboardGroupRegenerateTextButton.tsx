'use client'

import TaskStatusInline from '@/components/task/TaskStatusInline'
import { AppIcon } from '@/components/ui/icons'
import { GlassButton } from '@/components/ui/primitives'
import type { StoryboardGroupRegenerateTextButtonProps } from './StoryboardGroupActions.types'

export default function StoryboardGroupRegenerateTextButton({
  label,
  isSubmittingStoryboardTextTask,
  textTaskRunningState,
  onRegenerateText,
}: StoryboardGroupRegenerateTextButtonProps) {
  return (
    <GlassButton
      variant="secondary"
      size="sm"
      onClick={onRegenerateText}
      disabled={isSubmittingStoryboardTextTask}
    >
      {isSubmittingStoryboardTextTask ? (
        <TaskStatusInline state={textTaskRunningState} />
      ) : (
        <>
          <AppIcon name="refresh" className="h-3 w-3" />
          <span>{label}</span>
        </>
      )}
    </GlassButton>
  )
}
