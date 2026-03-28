'use client'

import { AppIcon } from '@/components/ui/icons'
import { GlassButton } from '@/components/ui/primitives'
import type { StoryboardGroupManageButtonsProps } from './StoryboardGroupActions.types'

export default function StoryboardGroupManageButtons({
  addPanelLabel,
  deleteLabel,
  isSubmittingStoryboardTask,
  onAddPanel,
  onDeleteStoryboard,
}: StoryboardGroupManageButtonsProps) {
  return (
    <>
      <GlassButton variant="secondary" size="sm" onClick={onAddPanel}>
        <AppIcon name="plusMd" className="h-3.5 w-3.5" />
        <span>{addPanelLabel}</span>
      </GlassButton>

      <GlassButton
        variant="danger"
        size="sm"
        onClick={onDeleteStoryboard}
        disabled={isSubmittingStoryboardTask}
        title={deleteLabel}
      >
        <AppIcon name="trashAlt" className="h-3.5 w-3.5" />
        <span>{deleteLabel}</span>
      </GlassButton>
    </>
  )
}
