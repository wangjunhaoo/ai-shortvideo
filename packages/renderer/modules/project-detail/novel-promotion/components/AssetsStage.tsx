'use client'

/**
 * 资产确认阶段 - 小说推文模式专用
 * 包含TTS生成和资产分析
 * 
 * 重构说明 v2:
 * - 角色和场景操作函数已提取到 hooks/useCharacterActions 和 hooks/useLocationActions
 * - 批量生成逻辑已提取到 hooks/useBatchGeneration
 * - TTS/音色逻辑已提取到 hooks/useTTSGeneration
 * - 弹窗状态已提取到 hooks/useAssetModals
 * - 档案管理已提取到 hooks/useProfileManagement
 * - UI已拆分为 CharacterSection, LocationSection, AssetToolbar, AssetModals 组件
 */

import { useCallback, useMemo } from 'react'
// 移除了 useRouter 导入，因为不再需要在组件中操作 URL
import { useProjectAssets, useRefreshProjectAssets } from '@renderer/hooks/useRendererProjectQueries'
import {
  useGenerateProjectCharacterImage,
  useGenerateProjectLocationImage,
} from '@renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionOperations'

// Hooks
import { useCharacterActions } from './assets/hooks/useCharacterActions'
import { useLocationActions } from './assets/hooks/useLocationActions'
import { useBatchGeneration } from './assets/hooks/useBatchGeneration'
import { useTTSGeneration } from './assets/hooks/useTTSGeneration'
import { useAssetModals } from './assets/hooks/useAssetModals'
import { useProfileManagement } from './assets/hooks/useProfileManagement'
import { useAssetsCopyFromHub } from './assets/hooks/useAssetsCopyFromHub'
import { useAssetsGlobalActions } from './assets/hooks/useAssetsGlobalActions'
import { useAssetsImageEdit } from './assets/hooks/useAssetsImageEdit'
import { useAssetsStageI18n } from './assets/hooks/useAssetsStageI18n'

// Components
import AssetsStageSections from './assets/AssetsStageSections'
import { useAssetsStageSectionProps } from './assets/hooks/useAssetsStageSectionProps'
import { useAssetsStageViewState } from './assets/hooks/useAssetsStageViewState'

interface AssetsStageProps {
  projectId: string
  isAnalyzingAssets: boolean
  focusCharacterId?: string | null
  focusCharacterRequestId?: number
  // 🔥 通过 props 触发全局分析（避免 URL 参数竞态条件）
  triggerGlobalAnalyze?: boolean
  onGlobalAnalyzeComplete?: () => void
}

export default function AssetsStage({
  projectId,
  isAnalyzingAssets,
  focusCharacterId = null,
  focusCharacterRequestId = 0,
  triggerGlobalAnalyze = false,
  onGlobalAnalyzeComplete
}: AssetsStageProps) {
  const { data: assets } = useProjectAssets(projectId)
  const characters = useMemo(() => assets?.characters ?? [], [assets?.characters])
  const locations = useMemo(() => assets?.locations ?? [], [assets?.locations])
  const refreshAssets = useRefreshProjectAssets(projectId)

  const generateCharacterImage = useGenerateProjectCharacterImage(projectId)
  const generateLocationImage = useGenerateProjectLocationImage(projectId)

  const handleGenerateImage = useCallback(async (
    type: 'character' | 'location',
    id: string,
    appearanceId?: string,
    count?: number,
  ) => {
    if (type === 'character' && appearanceId) {
      await generateCharacterImage.mutateAsync({ characterId: id, appearanceId, count })
    } else if (type === 'location') {
      await generateLocationImage.mutateAsync({ locationId: id, count })
    }
  }, [generateCharacterImage, generateLocationImage])

  const {
    t,
    batchGenerationMessages,
    copyMessages,
    characterActionMessages,
    locationActionMessages,
    ttsMessages,
    profileMessages,
  } = useAssetsStageI18n()
  const {
    totalAppearances,
    totalLocations,
    totalAssets,
    previewImage,
    setPreviewImage,
    closePreviewImage,
    toast,
    showToast,
    closeToast,
    getAppearances,
    onRefresh,
  } = useAssetsStageViewState({
    characters,
    locations,
    refreshAssets,
  })

  const {
    isBatchSubmitting,
    batchProgress,
    activeTaskKeys,
    registerTransientTaskKey,
    clearTransientTaskKey,
    handleGenerateAllImages,
    handleRegenerateAllImages
  } = useBatchGeneration({
    projectId,
    handleGenerateImage,
    messages: batchGenerationMessages,
  })

  const {
    isGlobalAnalyzing,
    globalAnalyzingState,
    handleGlobalAnalyze,
  } = useAssetsGlobalActions({
    projectId,
    triggerGlobalAnalyze,
    onGlobalAnalyzeComplete,
    onRefresh,
    showToast,
    t,
  })

  const {
    copyFromGlobalTarget,
    isGlobalCopyInFlight,
    handleCopyFromGlobal,
    handleCopyLocationFromGlobal,
    handleVoiceSelectFromHub,
    handleConfirmCopyFromGlobal,
    handleCloseCopyPicker,
  } = useAssetsCopyFromHub({
    projectId,
    onRefresh,
    showToast,
    messages: copyMessages,
  })

  // 角色操作
  const {
    handleDeleteCharacter,
    handleDeleteAppearance,
    handleSelectCharacterImage,
    handleConfirmSelection,
    handleRegenerateSingleCharacter,
    handleRegenerateCharacterGroup
  } = useCharacterActions({
    projectId,
    showToast,
    messages: characterActionMessages,
  })

  // 场景操作
  const {
    handleDeleteLocation,
    handleSelectLocationImage,
    handleConfirmLocationSelection,
    handleRegenerateSingleLocation,
    handleRegenerateLocationGroup
  } = useLocationActions({
    projectId,
    showToast,
    messages: locationActionMessages,
  })

  // TTS/音色
  const {
    voiceDesignCharacter,
    handleVoiceChange,
    handleOpenVoiceDesign,
    handleVoiceDesignSave,
    handleCloseVoiceDesign
  } = useTTSGeneration({
    projectId,
    messages: ttsMessages,
  })

  // 弹窗状态
  const {
    editingAppearance,
    editingLocation,
    showAddCharacter,
    showAddLocation,
    imageEditModal,
    characterImageEditModal,
    setShowAddCharacter,
    setShowAddLocation,
    handleEditAppearance,
    handleEditLocation,
    handleOpenLocationImageEdit,
    handleOpenCharacterImageEdit,
    closeEditingAppearance,
    closeEditingLocation,
    closeAddCharacter,
    closeAddLocation,
    closeImageEditModal,
    closeCharacterImageEditModal
  } = useAssetModals({
    projectId
  })
  // 档案管理
  const {
    unconfirmedCharacters,
    isConfirmingCharacter,
    deletingCharacterId,
    batchConfirming,
    editingProfile,
    handleEditProfile,
    handleConfirmProfile,
    handleBatchConfirm,
    handleDeleteProfile,
    setEditingProfile
  } = useProfileManagement({
    projectId,
    showToast,
    messages: profileMessages,
  })

  const {
    handleUndoCharacter,
    handleUndoLocation,
    handleLocationImageEdit,
    handleCharacterImageEdit,
    handleUpdateAppearanceDescription,
    handleUpdateLocationDescription,
  } = useAssetsImageEdit({
    projectId,
    t,
    showToast,
    onRefresh,
    editingAppearance,
    editingLocation,
    imageEditModal,
    characterImageEditModal,
    closeEditingAppearance,
    closeEditingLocation,
    closeImageEditModal,
    closeCharacterImageEditModal,
  })

  const {
    statusOverlayProps,
    toolbarProps,
    unconfirmedProfilesProps,
    characterSectionProps,
    locationSectionProps,
    modalsProps,
  } = useAssetsStageSectionProps({
    projectId,
    focusCharacterId,
    focusCharacterRequestId,
    isAnalyzingAssets,
    t,
    totalAssets,
    totalAppearances,
    totalLocations,
    toast,
    closeToast,
    isGlobalAnalyzing,
    globalAnalyzingState,
    isBatchSubmitting,
    batchProgress,
    handleGenerateAllImages,
    handleRegenerateAllImages,
    handleGlobalAnalyze,
    unconfirmedCharacters,
    batchConfirming,
    deletingCharacterId,
    isConfirmingCharacter,
    handleBatchConfirm,
    handleEditProfile,
    handleConfirmProfile,
    handleCopyFromGlobal,
    handleDeleteProfile,
    activeTaskKeys,
    clearTransientTaskKey,
    registerTransientTaskKey,
    setShowAddCharacter,
    handleDeleteCharacter,
    handleDeleteAppearance,
    handleEditAppearance,
    handleGenerateImage,
    handleSelectCharacterImage,
    handleConfirmSelection,
    handleRegenerateSingleCharacter,
    handleRegenerateCharacterGroup,
    handleUndoCharacter,
    setPreviewImage,
    handleOpenCharacterImageEdit,
    handleVoiceChange,
    handleOpenVoiceDesign,
    handleVoiceSelectFromHub,
    getAppearances,
    setShowAddLocation,
    handleDeleteLocation,
    handleEditLocation,
    handleSelectLocationImage,
    handleConfirmLocationSelection,
    handleRegenerateSingleLocation,
    handleRegenerateLocationGroup,
    handleUndoLocation,
    handleOpenLocationImageEdit,
    handleCopyLocationFromGlobal,
    onRefresh,
    closePreviewImage,
    handleUpdateAppearanceDescription,
    handleUpdateLocationDescription,
    handleLocationImageEdit,
    handleCharacterImageEdit,
    handleCloseVoiceDesign,
    handleVoiceDesignSave,
    handleCloseCopyPicker,
    handleConfirmCopyFromGlobal,
    closeEditingAppearance,
    closeEditingLocation,
    closeAddCharacter,
    closeAddLocation,
    closeImageEditModal,
    closeCharacterImageEditModal,
    setEditingProfile,
    previewImage,
    imageEditModal,
    characterImageEditModal,
    editingAppearance,
    editingLocation,
    showAddCharacter,
    showAddLocation,
    voiceDesignCharacter,
    editingProfile,
    copyFromGlobalTarget,
    isGlobalCopyInFlight,
  })

  return (
    <AssetsStageSections
      statusOverlayProps={statusOverlayProps}
      toolbarProps={toolbarProps}
      unconfirmedProfilesProps={unconfirmedProfilesProps}
      characterSectionProps={characterSectionProps}
      locationSectionProps={locationSectionProps}
      modalsProps={modalsProps}
    />
  )
}
