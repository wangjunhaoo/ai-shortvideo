'use client'

import type { ReactNode } from 'react'
import type { TaskPresentationState } from '@/lib/task/presentation'

export interface StoryboardStageShellProps {
  children: ReactNode
  isTransitioning: boolean
  isNextDisabled: boolean
  transitioningState: TaskPresentationState | null
  labels: StoryboardStageShellLabels
  onNext: () => void
}

export interface StoryboardStageShellLabels {
  generateVideoLabel: string
}

export interface StoryboardStageNextButtonProps {
  generateVideoLabel: string
  isTransitioning: boolean
  isNextDisabled: boolean
  transitioningState: TaskPresentationState | null
  onNext: () => void
}
