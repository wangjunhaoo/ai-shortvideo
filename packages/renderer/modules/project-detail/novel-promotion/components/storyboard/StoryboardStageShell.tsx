'use client'

import StoryboardStageNextButton from './StoryboardStageNextButton'
import type { StoryboardStageShellProps } from './StoryboardStageShell.types'

export default function StoryboardStageShell({
  children,
  isTransitioning,
  isNextDisabled,
  transitioningState,
  labels,
  onNext,
}: StoryboardStageShellProps) {
  return (
    <div className="space-y-6 pb-20">
      {children}
      <StoryboardStageNextButton
        generateVideoLabel={labels.generateVideoLabel}
        isTransitioning={isTransitioning}
        isNextDisabled={isNextDisabled}
        transitioningState={transitioningState}
        onNext={onNext}
      />
    </div>
  )
}
