'use client'

import TaskStatusInline from '@/components/task/TaskStatusInline'
import type { StoryboardStageNextButtonProps } from './StoryboardStageShell.types'

export default function StoryboardStageNextButton({
  generateVideoLabel,
  isTransitioning,
  isNextDisabled,
  transitioningState,
  onNext,
}: StoryboardStageNextButtonProps) {
  return (
    <button
      onClick={onNext}
      disabled={isNextDisabled}
      className="glass-btn-base glass-btn-primary fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl px-6 py-3 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isTransitioning ? (
        <TaskStatusInline
          state={transitioningState}
          className="text-white [&>span]:text-white [&_svg]:text-white"
        />
      ) : (
        generateVideoLabel
      )}
    </button>
  )
}
