'use client'

import TaskStatusInline from '@/components/task/TaskStatusInline'
import { AppIcon } from '@/components/ui/icons'
import { GlassButton } from '@/components/ui/primitives'
import type { StoryboardAddGroupButtonProps } from './StoryboardToolbar.types'

export default function StoryboardAddGroupButton({
  label,
  addingStoryboardGroup,
  addingStoryboardGroupState,
  onAddStoryboardGroupAtStart,
}: StoryboardAddGroupButtonProps) {
  return (
    <GlassButton
      variant="ghost"
      size="sm"
      onClick={onAddStoryboardGroupAtStart}
      disabled={addingStoryboardGroup}
      className="opacity-60 hover:opacity-100"
    >
      {addingStoryboardGroup ? (
        <TaskStatusInline state={addingStoryboardGroupState} />
      ) : (
        <>
          <AppIcon name="plusAlt" className="w-4 h-4" />
          <span>{label}</span>
        </>
      )}
    </GlassButton>
  )
}
