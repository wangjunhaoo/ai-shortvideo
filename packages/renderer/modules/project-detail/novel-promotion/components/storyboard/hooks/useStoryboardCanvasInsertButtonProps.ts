'use client'

import { useMemo, type ComponentProps } from 'react'
import StoryboardCanvasInsertButton from '../StoryboardCanvasInsertButton'
import type { StoryboardCanvasItemProps } from '../StoryboardCanvasItem.types'

interface UseStoryboardCanvasInsertButtonPropsParams
  extends Pick<StoryboardCanvasItemProps, 'sbIndex' | 'canvas'> {}

export function useStoryboardCanvasInsertButtonProps({
  sbIndex,
  canvas,
}: UseStoryboardCanvasInsertButtonPropsParams) {
  return useMemo(
    () =>
      ({
        label: canvas.labels.insertHereLabel,
        disabled: canvas.addingStoryboardGroup,
        onInsert: () => canvas.addStoryboardGroup(sbIndex + 1),
      }) satisfies ComponentProps<typeof StoryboardCanvasInsertButton>,
    [canvas, sbIndex],
  )
}
