'use client'

import type { StoryboardCanvasProps } from './StoryboardCanvas.types'
import StoryboardCanvasEmptyState from './StoryboardCanvasEmptyState'
import StoryboardCanvasItem from './StoryboardCanvasItem'

export default function StoryboardCanvas({
  ...props
}: StoryboardCanvasProps) {
  const { labels, sortedStoryboards } = props
  if (sortedStoryboards.length === 0) {
    return (
      <StoryboardCanvasEmptyState
        title={labels.emptyTitle}
        description={labels.emptyDescription}
      />
    )
  }

  return (
    <>
      {sortedStoryboards.map((storyboard, sbIndex) => (
        <StoryboardCanvasItem
          key={storyboard.id}
          storyboard={storyboard}
          sbIndex={sbIndex}
          canvas={props}
        />
      ))}
    </>
  )
}
