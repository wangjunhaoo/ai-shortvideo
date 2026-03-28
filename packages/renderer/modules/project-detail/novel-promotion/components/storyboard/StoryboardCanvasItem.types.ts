'use client'

import type { NovelPromotionStoryboard } from '@/types/project'
import type { StoryboardCanvasProps } from './StoryboardCanvas.types'

export interface StoryboardCanvasItemProps {
  storyboard: NovelPromotionStoryboard
  sbIndex: number
  canvas: StoryboardCanvasProps
}
