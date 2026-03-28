'use client'

import { useCallback, useMemo } from 'react'
import {
  NovelPromotionStoryboard,
  NovelPromotionClip,
  Character,
  Location,
} from '@/types/project'
import { useProjectAssets } from '@renderer/hooks/useRendererProjectQueries'
import {
  useUpdateProjectPhotographyPlan,
  useUpdateProjectPanelActingNotes,
} from '@renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionRuntimeHooks'
import { useStoryboardState } from './useStoryboardState'
import { usePanelOperations } from './usePanelOperations'
import { useStoryboardImageGeneration } from './useImageGeneration'
import { usePanelVariant } from './usePanelVariant'
import { useStoryboardTaskAwareStoryboards } from './useStoryboardTaskAwareStoryboards'
import { useStoryboardPanelAssetActions } from './useStoryboardPanelAssetActions'
import { useStoryboardStageUiState } from './useStoryboardStageUiState'
import { useStoryboardStageStatus } from './useStoryboardStageStatus'
import type { StoryboardGroupActionMessages } from './useStoryboardGroupActions'
import type { PanelCrudActionMessages } from './usePanelCrudActions'
import type { PanelInsertActionMessages } from './usePanelInsertActions'
import type { PanelCandidateMessages } from './usePanelCandidates'
import type { PanelImageModificationMessages } from './usePanelImageModification'
import type { PanelImageDownloadMessages } from './usePanelImageDownload'
import type { StoryboardBatchPanelGenerationMessages } from './useStoryboardBatchPanelGeneration'
import type { PanelVariantMessages } from './usePanelVariant'

interface UseStoryboardStageControllerProps {
  projectId: string
  episodeId: string
  initialStoryboards: NovelPromotionStoryboard[]
  clips: NovelPromotionClip[]
  isTransitioning: boolean
  messages: StoryboardStageControllerMessages
}

export interface StoryboardStageControllerMessages {
  panelOperations: {
    group: StoryboardGroupActionMessages
    panelCrud: PanelCrudActionMessages
    panelInsert: PanelInsertActionMessages
  }
  imageGeneration: {
    candidates: PanelCandidateMessages
    imageModification: PanelImageModificationMessages
    imageDownload: PanelImageDownloadMessages
  }
  panelAssetActions: StoryboardBatchPanelGenerationMessages
  panelVariant: PanelVariantMessages
}

export function useStoryboardStageController({
  projectId,
  episodeId,
  initialStoryboards,
  clips,
  isTransitioning,
  messages,
}: UseStoryboardStageControllerProps) {
  const isRunningPhase = useCallback((phase: string | null | undefined) => {
    return phase === 'queued' || phase === 'processing'
  }, [])

  const { data: assets } = useProjectAssets(projectId)
  const characters: Character[] = useMemo(() => assets?.characters ?? [], [assets?.characters])
  const locations: Location[] = useMemo(() => assets?.locations ?? [], [assets?.locations])

  const { taskAwareStoryboards } = useStoryboardTaskAwareStoryboards({
    projectId,
    initialStoryboards,
    isRunningPhase,
  })

  const storyboardState = useStoryboardState({
    projectId,
    episodeId,
    initialStoryboards: taskAwareStoryboards,
    clips,
  })

  const {
    localStoryboards,
    setLocalStoryboards,
    sortedStoryboards,
    expandedClips,
    toggleExpandedClip,
    panelEditsRef,
    getClipInfo,
    getTextPanels,
    getPanelEditData,
    updatePanelEdit,
    formatClipTitle,
    totalPanels,
    storyboardStartIndex,
  } = storyboardState

  const panelOps = usePanelOperations({
    projectId,
    episodeId,
    panelEditsRef,
    messages: messages.panelOperations,
  })

  const {
    savingPanels,
    deletingPanelIds,
    saveStateByPanel,
    hasUnsavedByPanel,
    submittingStoryboardTextIds,
    addingStoryboardGroup,
    movingClipId,
    insertingAfterPanelId,
    savePanelWithData,
    debouncedSave,
    retrySave,
    addPanel,
    deletePanel,
    deleteStoryboard,
    regenerateStoryboardText,
    addStoryboardGroup,
    moveStoryboardGroup,
    addCharacterToPanel,
    removeCharacterFromPanel,
    setPanelLocation,
    insertPanel,
  } = panelOps

  const variantOps = usePanelVariant({
    projectId,
    episodeId,
    setLocalStoryboards,
    messages: messages.panelVariant,
  })

  const { submittingVariantPanelId, generatePanelVariant } = variantOps

  const imageOps = useStoryboardImageGeneration({
    projectId,
    episodeId,
    localStoryboards,
    setLocalStoryboards,
    messages: messages.imageGeneration,
  })

  const {
    submittingStoryboardIds,
    submittingPanelImageIds,
    selectingCandidateIds,
    editingPanel,
    setEditingPanel,
    modifyingPanels,
    isDownloadingImages,
    previewImage,
    setPreviewImage,
    regeneratePanelImage,
    regenerateAllPanelsIndividually,
    selectPanelCandidate,
    selectPanelCandidateIndex,
    cancelPanelCandidate,
    getPanelCandidates,
    modifyPanelImage,
    downloadAllImages,
    clearStoryboardError,
  } = imageOps

  const updatePhotographyPlanMutation = useUpdateProjectPhotographyPlan(projectId)
  const updatePanelActingNotesMutation = useUpdateProjectPanelActingNotes(projectId)

  const {
    assetPickerPanel,
    setAssetPickerPanel,
    aiDataPanel,
    setAIDataPanel,
    isEpisodeBatchSubmitting,
    setIsEpisodeBatchSubmitting,
  } = useStoryboardStageUiState()

  const {
    getDefaultAssetsForClip,
    handleEditSubmit,
    handlePanelUpdate,
    handleAddCharacter,
    handleSetLocation,
    handleRemoveCharacter,
    handleRemoveLocation,
    runningCount,
    pendingPanelCount,
    handleGenerateAllPanels,
  } = useStoryboardPanelAssetActions({
    clips,
    characters,
    locations,
    localStoryboards,
    sortedStoryboards,
    submittingPanelImageIds,
    editingPanel,
    setEditingPanel,
    setIsEpisodeBatchSubmitting,
    getTextPanels,
    getPanelEditData,
    updatePanelEdit,
    debouncedSave,
    regeneratePanelImage,
    modifyPanelImage,
    addCharacterToPanel,
    removeCharacterFromPanel,
    setPanelLocation,
    assetPickerPanel,
    setAssetPickerPanel,
    batchGenerationMessages: messages.panelAssetActions,
  })

  const { addingStoryboardGroupState, transitioningState } = useStoryboardStageStatus({
    addingStoryboardGroup,
    isTransitioning,
  })

  return {
    localStoryboards, setLocalStoryboards, sortedStoryboards, expandedClips, toggleExpandedClip,
    getClipInfo, getTextPanels, getPanelEditData, updatePanelEdit, formatClipTitle, totalPanels, storyboardStartIndex,
    savingPanels, deletingPanelIds, saveStateByPanel, hasUnsavedByPanel, submittingStoryboardTextIds, addingStoryboardGroup, movingClipId, insertingAfterPanelId,
    savePanelWithData, addPanel, deletePanel, deleteStoryboard, regenerateStoryboardText, addStoryboardGroup, moveStoryboardGroup, insertPanel,
    submittingVariantPanelId, generatePanelVariant,
    submittingStoryboardIds, submittingPanelImageIds, selectingCandidateIds,
    editingPanel, setEditingPanel, modifyingPanels, isDownloadingImages, previewImage, setPreviewImage,
    regeneratePanelImage, regenerateAllPanelsIndividually, selectPanelCandidate, selectPanelCandidateIndex,
    cancelPanelCandidate, getPanelCandidates, modifyPanelImage, downloadAllImages, clearStoryboardError,
    assetPickerPanel, setAssetPickerPanel, aiDataPanel, setAIDataPanel, isEpisodeBatchSubmitting,
    getDefaultAssetsForClip, handleEditSubmit, handlePanelUpdate, handleAddCharacter, handleSetLocation, handleRemoveCharacter, handleRemoveLocation,
    retrySave,
    updatePhotographyPlanMutation, updatePanelActingNotesMutation,
    addingStoryboardGroupState, transitioningState, runningCount, pendingPanelCount, handleGenerateAllPanels,
  }
}

