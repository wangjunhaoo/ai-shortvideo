'use client'

import { useCallback, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEpisodeData, useProjectAssets } from '@renderer/hooks/useRendererProjectQueries'
import {
  useAnalyzeProjectVoice,
  useCreateProjectVoiceLine,
  useDeleteProjectVoiceLine,
  useDownloadProjectVoices,
  useGenerateProjectVoice,
  useUpdateProjectVoiceLine,
  useUpdateSpeakerVoice,
} from '@renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionRuntimeHooks'
import VoiceLineList from '@renderer/modules/project-detail/novel-promotion/components/voice-stage/VoiceLineList'
import VoiceControlPanel, { type VoiceControlPanelLabels } from '@renderer/modules/project-detail/novel-promotion/components/voice-stage/VoiceControlPanel'
import SpeakerVoiceBindingDialog from '@renderer/modules/project-detail/novel-promotion/components/voice/SpeakerVoiceBindingDialog'
import type {
  Character,
  InlineSpeakerVoiceBinding,
  PendingVoiceGenerationMap,
  VoiceStageShellProps,
} from '../runtime/types'
import { useVoicePlayback } from '../runtime/useVoicePlayback'
import { useVoiceLineEditorState } from '../runtime/useVoiceLineEditorState'
import { useVoiceTaskState } from '../runtime/useVoiceTaskState'
import { useBindablePanelOptions } from '../runtime/useBindablePanelOptions'
import { useVoiceSpeakerState } from '../runtime/useVoiceSpeakerState'
import { useVoiceStageDataLoader } from '../runtime/useVoiceStageDataLoader'
import { useSpeakerAssetNavigation } from '../runtime/useSpeakerAssetNavigation'
import { useVoiceGenerationActions } from '../runtime/useVoiceGenerationActions'
import { useVoiceLineCrudActions } from '../runtime/useVoiceLineCrudActions'
import { useVoiceRuntimeSync } from '../runtime/useVoiceRuntimeSync'
import { useVoiceLineBindings } from '../runtime/useVoiceLineBindings'
import { useVoiceStageI18n } from './useVoiceStageI18n'

export type { VoiceStageShellProps } from '../runtime/types'

export function useVoiceStageRuntime({
  projectId,
  episodeId,
  onBack,
  embedded = false,
  onVoiceLineClick,
  onVoiceLinesChanged,
  onOpenAssetLibraryForCharacter,
}: VoiceStageShellProps) {
  const {
    buildVoiceTaskFailureMessage,
    controlPanelLabels,
    loadingLabel,
    speakerVoiceBindingLabels,
    translate,
    translateWithValues,
    voiceLineListLabels,
  } = useVoiceStageI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  if (!pathname) {
    throw new Error('VoiceStage requires a non-null pathname')
  }
  if (!searchParams) {
    throw new Error('VoiceStage requires searchParams')
  }
  const { data: assets } = useProjectAssets(projectId)
  const { data: episodeData } = useEpisodeData(projectId, episodeId)
  const analyzeVoiceMutation = useAnalyzeProjectVoice(projectId)
  const generateVoiceMutation = useGenerateProjectVoice(projectId)
  const createVoiceLineMutation = useCreateProjectVoiceLine(projectId)
  const updateVoiceLineMutation = useUpdateProjectVoiceLine(projectId)
  const deleteVoiceLineMutation = useDeleteProjectVoiceLine(projectId)
  const downloadVoicesMutation = useDownloadProjectVoices(projectId)
  const updateSpeakerVoiceMutation = useUpdateSpeakerVoice(projectId)
  const characters: Character[] = useMemo(() => (assets?.characters ?? []) as Character[], [assets?.characters])
  const {
    voiceLines,
    setVoiceLines,
    speakerVoices,
    projectSpeakers,
    loading,
    loadData,
  } = useVoiceStageDataLoader({
    projectId,
    episodeId,
  })
  const notifyVoiceLinesChanged = useCallback(() => {
    onVoiceLinesChanged?.()
  }, [onVoiceLinesChanged])
  const handleVoiceTaskFailure = useCallback((params: {
    lineId: string
    line: { lineIndex: number } | null
    taskId: string | null
    errorMessage: string | null
  }) => {
    alert(buildVoiceTaskFailureMessage({
      lineIndex: params.line?.lineIndex,
      errorMessage: params.errorMessage,
    }))
  }, [buildVoiceTaskFailureMessage])
  const {
    speakerCharacterMap,
    speakerStats,
    speakers,
    speakerOptions,
    matchCharacterBySpeaker,
    getSpeakerVoiceUrl,
    linesWithVoice,
    linesWithAudio,
    allSpeakersHaveVoice,
  } = useVoiceSpeakerState({
    characters,
    voiceLines,
    projectSpeakers,
    speakerVoices,
  })
  const bindablePanelOptions = useBindablePanelOptions({
    episodeData,
    t: translateWithValues,
  })
  const {
    isLineEditorOpen,
    isSavingLineEditor,
    editingLineId,
    editingContent,
    editingSpeaker,
    editingMatchedPanelId,
    savingLineEditorState,
    setIsSavingLineEditor,
    setEditingContent,
    setEditingSpeaker,
    setEditingMatchedPanelId,
    handleStartAdd,
    handleStartEdit,
    handleCancelEdit,
  } = useVoiceLineEditorState({
    speakerOptions,
  })
  const { playingLineId, handleTogglePlayAudio } = useVoicePlayback()
  const [pendingVoiceGenerationByLineId, setPendingVoiceGenerationByLineId] = useState<PendingVoiceGenerationMap>({})
  const submittingVoiceLineIds = useMemo(
    () => new Set(Object.keys(pendingVoiceGenerationByLineId)),
    [pendingVoiceGenerationByLineId],
  )
  const { voiceStatusStateByLineId, activeVoiceTaskLineIds, runningLineIds } = useVoiceTaskState({
    projectId,
    voiceLines,
    submittingVoiceLineIds,
  })
  useVoiceRuntimeSync({
    loadData,
    voiceLines,
    activeVoiceTaskLineIds,
    pendingVoiceGenerationByLineId,
    setPendingVoiceGenerationByLineId,
    onTaskFailure: handleVoiceTaskFailure,
  })
  const { handleOpenAssetLibraryForSpeaker } = useSpeakerAssetNavigation({
    episodeId,
    pathname,
    router,
    searchParams,
    onOpenAssetLibraryForCharacter,
    matchCharacterBySpeaker,
  })
  const {
    analyzing,
    isBatchSubmittingAll,
    isDownloading,
    handleAnalyze,
    handleGenerateLine,
    handleGenerateAll,
    handleDownloadAll,
  } = useVoiceGenerationActions({
    projectId,
    episodeId,
    t: translate,
    voiceLines,
    linesWithAudio,
    speakerCharacterMap,
    speakerVoices,
    analyzeVoiceMutation,
    generateVoiceMutation,
    downloadVoicesMutation,
    loadData,
    notifyVoiceLinesChanged,
    setPendingVoiceGenerationByLineId,
  })
  const {
    getBoundPanelIdForLine,
    handleStartEditLine,
    handleLocatePanel,
    handleDownloadSingle,
  } = useVoiceLineBindings({
    bindablePanelOptions,
    onVoiceLineClick,
    handleStartEdit,
  })
  const {
    handleSaveEdit,
    handleDeleteLine,
    handleDeleteAudio,
    handleSaveEmotionSettings,
  } = useVoiceLineCrudActions({
    episodeId,
    t: translateWithValues,
    voiceLines,
    editingLineId,
    editingContent,
    editingSpeaker,
    editingMatchedPanelId,
    setVoiceLines,
    setPendingVoiceGenerationByLineId,
    setIsSavingLineEditor,
    getBoundPanelIdForLine,
    handleCancelEdit,
    notifyVoiceLinesChanged,
    createVoiceLineMutation,
    updateVoiceLineMutation,
    deleteVoiceLineMutation,
  })

  // ─── 内联音色绑定弹窗状态 ───────────────────────────
  const [inlineBindingSpeaker, setInlineBindingSpeaker] = useState<string | null>(null)

  const handleOpenInlineBinding = useCallback((speaker: string) => {
    setInlineBindingSpeaker(speaker)
  }, [])

  const handleCloseInlineBinding = useCallback(() => {
    setInlineBindingSpeaker(null)
  }, [])

  /**
   * 判断发言人是否有匹配的项目角色
   * 有匹配角色 → 跳转资产中心；无匹配 → 打开内联绑定弹窗
   */
  const hasSpeakerCharacter = useCallback((speaker: string): boolean => {
    return !!matchCharacterBySpeaker(speaker)
  }, [matchCharacterBySpeaker])

  /**
   * 内联绑定完成后的回调：将音色信息写入 episode.speakerVoices
   */
  const handleInlineVoiceBound = useCallback(async (
    speaker: string,
    binding: InlineSpeakerVoiceBinding,
  ) => {
    try {
      await updateSpeakerVoiceMutation.mutateAsync({
        episodeId,
        speaker,
        ...binding,
      })
      // 重新加载数据以刷新 speakerVoices
      await loadData()
    } catch {
      // 处理后的错误会被 mutation 的 onError 捕获
    }
    setInlineBindingSpeaker(null)
  }, [episodeId, loadData, updateSpeakerVoiceMutation])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[var(--glass-text-tertiary)]">{loadingLabel}</div>
      </div>
    )
  }

  return (
    <>
      <VoiceControlPanel
        embedded={embedded}
        onBack={onBack}
        analyzing={analyzing}
        isBatchSubmittingAll={isBatchSubmittingAll}
        isDownloading={isDownloading}
        runningLineCount={runningLineIds.size}
        allSpeakersHaveVoice={allSpeakersHaveVoice}
        totalLines={voiceLines.length}
        linesWithVoice={linesWithVoice}
        linesWithAudio={linesWithAudio}
        speakers={speakers}
        speakerStats={speakerStats}
        isLineEditorOpen={isLineEditorOpen}
        isSavingLineEditor={isSavingLineEditor}
        editingLineId={editingLineId}
        editingContent={editingContent}
        editingSpeaker={editingSpeaker}
        editingMatchedPanelId={editingMatchedPanelId}
        speakerOptions={speakerOptions}
        bindablePanelOptions={bindablePanelOptions}
        savingLineEditorState={savingLineEditorState}
        onAnalyze={handleAnalyze}
        onGenerateAll={handleGenerateAll}
        onDownloadAll={handleDownloadAll}
        onStartAdd={handleStartAdd}
        onOpenAssetLibraryForSpeaker={handleOpenAssetLibraryForSpeaker}
        onOpenInlineBinding={handleOpenInlineBinding}
        hasSpeakerCharacter={hasSpeakerCharacter}
        onCancelEdit={handleCancelEdit}
        onSaveEdit={handleSaveEdit}
        onEditingContentChange={setEditingContent}
        onEditingSpeakerChange={setEditingSpeaker}
        onEditingMatchedPanelIdChange={setEditingMatchedPanelId}
        getSpeakerVoiceUrl={getSpeakerVoiceUrl}
        labels={controlPanelLabels}
      >
        <VoiceLineList
          voiceLines={voiceLines}
          runningLineIds={runningLineIds}
          voiceStatusStateByLineId={voiceStatusStateByLineId}
          playingLineId={playingLineId}
          analyzing={analyzing}
          getSpeakerVoiceUrl={getSpeakerVoiceUrl}
          onTogglePlayAudio={handleTogglePlayAudio}
          onDownloadSingle={handleDownloadSingle}
          onGenerateLine={handleGenerateLine}
          onStartEdit={handleStartEditLine}
          onLocatePanel={handleLocatePanel}
          onDeleteLine={handleDeleteLine}
          onDeleteAudio={handleDeleteAudio}
          onSaveEmotionSettings={handleSaveEmotionSettings}
          onAnalyze={handleAnalyze}
          labels={voiceLineListLabels}
        />
      </VoiceControlPanel>

      {/* 内联音色绑定弹窗 */}
      <SpeakerVoiceBindingDialog
        isOpen={!!inlineBindingSpeaker}
        speaker={inlineBindingSpeaker ?? ''}
        projectId={projectId}
        episodeId={episodeId}
        onClose={handleCloseInlineBinding}
        onBound={handleInlineVoiceBound}
        labels={speakerVoiceBindingLabels}
      />
    </>
  )
}




