'use client'

import { NovelPromotionStoryboard, NovelPromotionClip } from '@/types/project'
import type { StoryboardCanvasProps } from '../StoryboardCanvas.types'
import type { StoryboardToolbarProps } from '../StoryboardToolbar.types'
import type { StoryboardStageShellLabels } from '../StoryboardStageShell.types'
import {
  useStoryboardStageController,
  type StoryboardStageControllerMessages,
} from './useStoryboardStageController'
import { useStoryboardModalRuntime } from './useStoryboardModalRuntime'
import { useStoryboardStageSectionProps } from './useStoryboardStageSectionProps'
import type {
  StoryboardStageAssetPickerLabels,
  StoryboardStagePrimaryModalLabels,
} from '../StoryboardStageModals.types'

interface UseStoryboardStageRuntimeParams {
  projectId: string
  episodeId: string
  initialStoryboards: NovelPromotionStoryboard[]
  clips: NovelPromotionClip[]
  videoRatio: string
  onBack: () => void
  isTransitioning: boolean
  toolbarLabels: StoryboardToolbarProps['labels']
  canvasLabels: StoryboardCanvasProps['labels']
  stageShellLabels: StoryboardStageShellLabels
  primaryModalLabels: StoryboardStagePrimaryModalLabels
  assetPickerLabels: StoryboardStageAssetPickerLabels
  controllerMessages: StoryboardStageControllerMessages
}

export function useStoryboardStageRuntime({
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
}: UseStoryboardStageRuntimeParams) {
  const controller = useStoryboardStageController({
    projectId,
    episodeId,
    initialStoryboards,
    clips,
    isTransitioning,
    messages: controllerMessages,
  })

  const modalRuntime = useStoryboardModalRuntime({
    projectId,
    videoRatio,
    localStoryboards: controller.localStoryboards,
    editingPanel: controller.editingPanel,
    setEditingPanel: controller.setEditingPanel,
    assetPickerPanel: controller.assetPickerPanel,
    setAssetPickerPanel: controller.setAssetPickerPanel,
    aiDataPanel: controller.aiDataPanel,
    setAIDataPanel: controller.setAIDataPanel,
    previewImage: controller.previewImage,
    setPreviewImage: controller.setPreviewImage,
    getTextPanels: controller.getTextPanels,
    getPanelEditData: controller.getPanelEditData,
    updatePanelEdit: controller.updatePanelEdit,
    savePanelWithData: controller.savePanelWithData,
    getDefaultAssetsForClip: controller.getDefaultAssetsForClip,
    handleEditSubmit: controller.handleEditSubmit,
    handleAddCharacter: controller.handleAddCharacter,
    handleSetLocation: controller.handleSetLocation,
    updatePhotographyPlanMutation: controller.updatePhotographyPlanMutation,
    updatePanelActingNotesMutation: controller.updatePanelActingNotesMutation,
  })

  const sectionProps = useStoryboardStageSectionProps({
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
  })

  return {
    isNextDisabled: isTransitioning || controller.localStoryboards.length === 0,
    transitioningState: controller.transitioningState,
    ...sectionProps,
  }
}
