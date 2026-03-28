'use client'

import { useCallback, useMemo, useState } from 'react'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { useAiModifyProjectShotPrompt } from '@renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionRuntimeHooks'
import type { NovelPromotionShot } from '@/types/project'
import type {
  PromptsStageShellProps,
} from './promptStageRuntime.types'
import { usePromptEditorRuntime } from './hooks/usePromptEditorRuntime'
import { usePromptAppendFlow } from './hooks/usePromptAppendFlow'
import { usePromptStageI18n } from './hooks/usePromptStageI18n'

export type {
  PromptsStageShellProps,
  LocationAssetWithImages,
} from './promptStageRuntime.types'
export {
  getErrorMessage,
  parseImagePrompt,
} from './promptStageRuntime.utils'

export function usePromptStageActions({
  projectId,
  shots,
  viewMode,
  onViewModeChange,
  onGenerateImage,
  onGenerateAllImages,
  isBatchSubmitting = false,
  onBack,
  onNext,
  onUpdatePrompt,
  artStyle,
  assetLibraryCharacters,
  assetLibraryLocations,
  onAppendContent,
}: PromptsStageShellProps) {
  const aiModifyShotPrompt = useAiModifyProjectShotPrompt(projectId)
  const {
    styleLabel,
    labels,
    editorMessages,
    appendMessages,
  } = usePromptStageI18n(artStyle)

  const isShotTaskRunning = useCallback((shot: NovelPromotionShot) => {
    return Boolean((shot as NovelPromotionShot & { imageTaskRunning?: boolean }).imageTaskRunning)
  }, [])

  const runningCount = shots.filter((shot) => isShotTaskRunning(shot)).length
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const editorRuntime = usePromptEditorRuntime({
    onUpdatePrompt,
    onGenerateImage,
    aiModifyShotPrompt,
    messages: editorMessages,
  })

  const appendFlow = usePromptAppendFlow({
    onAppendContent,
    messages: appendMessages,
  })

  const isAnyTaskRunning = runningCount > 0 || isBatchSubmitting

  const getGenerateButtonToneClass = (shot: NovelPromotionShot) => {
    if (shot.imageUrl) return 'glass-btn-tone-success'
    if (isShotTaskRunning(shot)) return 'glass-btn-soft'
    return 'glass-btn-primary'
  }

  const getShotRunningState = useCallback((shot: NovelPromotionShot) => {
    if (!isShotTaskRunning(shot)) return null
    return resolveTaskPresentationState({
      phase: 'processing',
      intent: shot.imageUrl ? 'regenerate' : 'generate',
      resource: 'image',
      hasOutput: !!shot.imageUrl,
    })
  }, [isShotTaskRunning])

  const batchTaskRunningState = useMemo(() => {
    if (!isAnyTaskRunning) return null
    return resolveTaskPresentationState({
      phase: 'processing',
      intent: 'generate',
      resource: 'image',
      hasOutput: true,
    })
  }, [isAnyTaskRunning])

  return {
    shots,
    viewMode,
    onViewModeChange,
    onGenerateImage,
    onGenerateAllImages,
    isBatchSubmitting,
    onBack,
    onNext,
    onAppendContent,
    assetLibraryCharacters,
    assetLibraryLocations,
    styleLabel,
    labels,
    runningCount,
    isAnyTaskRunning,
    previewImage,
    setPreviewImage,

    editingPrompt: editorRuntime.editingPrompt,
    editValue: editorRuntime.editValue,
    aiModifyInstruction: editorRuntime.aiModifyInstruction,
    selectedAssets: editorRuntime.selectedAssets,
    showAssetPicker: editorRuntime.showAssetPicker,
    aiModifyingShots: editorRuntime.aiModifyingShots,
    textareaRef: editorRuntime.textareaRef,
    shotExtraAssets: editorRuntime.shotExtraAssets,

    appendContent: appendFlow.appendContent,
    isAppending: appendFlow.isAppending,
    appendTaskRunningState: appendFlow.appendTaskRunningState,

    getGenerateButtonToneClass,
    getShotRunningState,
    batchTaskRunningState,
    isShotTaskRunning,

    handleStartEdit: editorRuntime.handleStartEdit,
    handleSaveEdit: editorRuntime.handleSaveEdit,
    handleCancelEdit: editorRuntime.handleCancelEdit,
    handleModifyInstructionChange: editorRuntime.handleModifyInstructionChange,
    handleSelectAsset: editorRuntime.handleSelectAsset,
    handleAiModify: editorRuntime.handleAiModify,
    handleEditValueChange: editorRuntime.handleEditValueChange,
    handleRemoveSelectedAsset: editorRuntime.handleRemoveSelectedAsset,

    setAppendContent: appendFlow.setAppendContent,
    handleAppendSubmit: appendFlow.handleAppendSubmit,
  }
}

export type PromptStageRuntime = ReturnType<typeof usePromptStageActions>

