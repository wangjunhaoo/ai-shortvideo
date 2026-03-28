'use client'

import { NovelPromotionStoryboard, NovelPromotionClip } from '@/types/project'
import StoryboardStageShell from './StoryboardStageShell'
import StoryboardStageModals from './StoryboardStageModals'
import StoryboardToolbar from './StoryboardToolbar'
import StoryboardCanvas from './StoryboardCanvas'
import { useStoryboardStageRuntime } from './hooks/useStoryboardStageRuntime'
import { useStoryboardStageLabels } from './hooks/useStoryboardStageLabels'

interface StoryboardStageProps {
  projectId: string
  episodeId: string
  storyboards: NovelPromotionStoryboard[]
  clips: NovelPromotionClip[]
  videoRatio: string
  onBack: () => void
  onNext: () => void
  isTransitioning?: boolean
}

export default function StoryboardStage({
  projectId,
  episodeId,
  storyboards: initialStoryboards,
  clips,
  videoRatio,
  onBack,
  onNext,
  isTransitioning = false,
}: StoryboardStageProps) {
  const {
    controllerMessages,
    toolbarLabels,
    canvasLabels,
    primaryModalLabels,
    assetPickerLabels,
    stageShellLabels,
  } = useStoryboardStageLabels()
  const {
    isNextDisabled,
    transitioningState,
    toolbarProps,
    canvasProps,
    modalsProps,
    stageShellLabels: runtimeStageShellLabels,
  } = useStoryboardStageRuntime({
    projectId,
    episodeId,
    initialStoryboards,
    clips,
    videoRatio,
    onBack,
    isTransitioning,
    toolbarLabels,
    canvasLabels,
    stageShellLabels,
    primaryModalLabels,
    assetPickerLabels,
    controllerMessages,
  })

  return (
    <StoryboardStageShell
      isTransitioning={isTransitioning}
      isNextDisabled={isNextDisabled}
      transitioningState={transitioningState}
      labels={runtimeStageShellLabels}
      onNext={onNext}
    >
      <StoryboardToolbar {...toolbarProps} />

      <StoryboardCanvas {...canvasProps} />

      <StoryboardStageModals {...modalsProps} />
    </StoryboardStageShell>
  )
}
