'use client'

import { useMemo } from 'react'
import type { StoryboardCanvasItemProps } from '../StoryboardCanvasItem.types'

export function useStoryboardCanvasItemState({
  storyboard,
  canvas,
}: Pick<StoryboardCanvasItemProps, 'storyboard' | 'canvas'>) {
  const clip = useMemo(
    () => canvas.getClipInfo(storyboard.clipId),
    [canvas, storyboard.clipId],
  )

  const textPanels = useMemo(
    () => canvas.getTextPanels(storyboard),
    [canvas, storyboard],
  )

  const hasAnyImage = useMemo(
    () => textPanels.some((panel) => panel.imageUrl),
    [textPanels],
  )

  return {
    clip,
    textPanels,
    isSubmittingStoryboardTask: canvas.submittingStoryboardIds.has(storyboard.id),
    isSelectingCandidate: canvas.selectingCandidateIds.has(storyboard.id),
    isSubmittingStoryboardTextTask:
      canvas.submittingStoryboardTextIds.has(storyboard.id),
    hasAnyImage,
    failedError: storyboard.lastError ?? null,
  }
}
