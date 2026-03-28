'use client'

import type { ComponentProps } from 'react'
import StoryboardGroup from '../StoryboardGroup'
import type { StoryboardCanvasItemProps } from '../StoryboardCanvasItem.types'
import { useStoryboardCanvasInsertButtonProps } from './useStoryboardCanvasInsertButtonProps'
import { useStoryboardCanvasItemGroupProps } from './useStoryboardCanvasItemGroupProps'
import { useStoryboardCanvasItemState } from './useStoryboardCanvasItemState'

export function useStoryboardCanvasItemRuntime({
  storyboard,
  sbIndex,
  canvas,
}: StoryboardCanvasItemProps) {
  const {
    clip,
    textPanels,
    isSubmittingStoryboardTask,
    isSelectingCandidate,
    isSubmittingStoryboardTextTask,
    hasAnyImage,
    failedError,
  } = useStoryboardCanvasItemState({
    storyboard,
    canvas,
  })

  const groupProps = useStoryboardCanvasItemGroupProps({
    storyboard,
    sbIndex,
    canvas,
    clip,
    textPanels,
    isSubmittingStoryboardTask,
    isSelectingCandidate,
    isSubmittingStoryboardTextTask,
    hasAnyImage,
    failedError,
  })

  const insertButtonProps = useStoryboardCanvasInsertButtonProps({
    sbIndex,
    canvas,
  })

  return {
    groupProps: groupProps satisfies ComponentProps<typeof StoryboardGroup>,
    insertButtonProps,
  }
}
