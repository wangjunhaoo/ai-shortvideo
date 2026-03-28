'use client'

import StoryboardGroup from './StoryboardGroup'
import StoryboardCanvasInsertButton from './StoryboardCanvasInsertButton'
import { useStoryboardCanvasItemRuntime } from './hooks/useStoryboardCanvasItemRuntime'
import type { StoryboardCanvasItemProps } from './StoryboardCanvasItem.types'

export default function StoryboardCanvasItem({
  storyboard,
  sbIndex,
  canvas,
}: StoryboardCanvasItemProps) {
  const { groupProps, insertButtonProps } = useStoryboardCanvasItemRuntime({
    storyboard,
    sbIndex,
    canvas,
  })

  return (
    <div>
      <StoryboardGroup {...groupProps} />
      <StoryboardCanvasInsertButton {...insertButtonProps} />
    </div>
  )
}
