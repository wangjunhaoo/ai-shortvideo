'use client'

import { useMemo, type ComponentProps } from 'react'
import type { useStoryboardModalRuntime } from './useStoryboardModalRuntime'
import { useStoryboardCanvasSectionProps } from './useStoryboardCanvasSectionProps'
import type { useStoryboardStageController } from './useStoryboardStageController'
import StoryboardStageModals from '../StoryboardStageModals'
import StoryboardToolbar from '../StoryboardToolbar'
import type { StoryboardCanvasProps } from '../StoryboardCanvas.types'
import type {
  StoryboardStageAssetPickerLabels,
  StoryboardStagePrimaryModalLabels,
} from '../StoryboardStageModals.types'
import type { StoryboardToolbarProps } from '../StoryboardToolbar.types'
import type { StoryboardStageShellLabels } from '../StoryboardStageShell.types'

type StoryboardStageController = ReturnType<typeof useStoryboardStageController>
type StoryboardModalRuntime = ReturnType<typeof useStoryboardModalRuntime>

interface UseStoryboardStageSectionPropsParams {
  controller: StoryboardStageController
  modalRuntime: StoryboardModalRuntime
  projectId: string
  episodeId: string
  videoRatio: string
  onBack: () => void
  toolbarLabels: StoryboardToolbarProps['labels']
  canvasLabels: StoryboardCanvasProps['labels']
  stageShellLabels: StoryboardStageShellLabels
  primaryModalLabels: StoryboardStagePrimaryModalLabels
  assetPickerLabels: StoryboardStageAssetPickerLabels
}

export function useStoryboardStageSectionProps({
  controller,
  modalRuntime,
  projectId,
  episodeId,
  videoRatio,
  onBack,
  toolbarLabels,
  canvasLabels,
  stageShellLabels,
  primaryModalLabels,
  assetPickerLabels,
}: UseStoryboardStageSectionPropsParams) {
  const toolbarProps = useMemo(() => ({
    totalSegments: controller.sortedStoryboards.length,
    totalPanels: controller.totalPanels,
    isDownloadingImages: controller.isDownloadingImages,
    runningCount: controller.runningCount,
    pendingPanelCount: controller.pendingPanelCount,
    isBatchSubmitting: controller.isEpisodeBatchSubmitting,
    addingStoryboardGroup: controller.addingStoryboardGroup,
    addingStoryboardGroupState: controller.addingStoryboardGroupState,
    onDownloadAllImages: controller.downloadAllImages,
    onGenerateAllPanels: controller.handleGenerateAllPanels,
    onAddStoryboardGroupAtStart: () => controller.addStoryboardGroup(0),
    onBack,
    labels: toolbarLabels,
  } satisfies ComponentProps<typeof StoryboardToolbar>), [
    controller.addStoryboardGroup,
    controller.addingStoryboardGroup,
    controller.addingStoryboardGroupState,
    controller.downloadAllImages,
    controller.handleGenerateAllPanels,
    controller.isDownloadingImages,
    controller.isEpisodeBatchSubmitting,
    controller.pendingPanelCount,
    controller.runningCount,
    controller.sortedStoryboards.length,
    controller.totalPanels,
    toolbarLabels,
    onBack,
  ])

  const canvasProps = useStoryboardCanvasSectionProps({
    controller,
    projectId,
    episodeId,
    videoRatio,
    labels: canvasLabels,
  })

  const modalsProps = useMemo(() => ({
    projectId,
    modalRuntime,
    getPanelEditData: controller.getPanelEditData,
    primaryLabels: primaryModalLabels,
    assetPickerLabels,
  } satisfies ComponentProps<typeof StoryboardStageModals>), [
    assetPickerLabels,
    controller.getPanelEditData,
    modalRuntime,
    primaryModalLabels,
    projectId,
  ])

  return {
    toolbarProps,
    canvasProps,
    modalsProps,
    stageShellLabels,
  }
}
