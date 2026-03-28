'use client'
import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'

import { useCallback, useState } from 'react'
import type { PanelEditData } from '../../PanelEditForm'
import type { StoryboardPanel } from './useStoryboardState'
import type { NovelPromotionStoryboard } from '@/types/project'
import {
  type PanelSaveState,
  type PanelSaveStatus,
} from './panel-save-coordinator'
import { usePanelSaveLifecycle } from './usePanelSaveLifecycle'
import {
  useCreateProjectPanel,
  useDeleteProjectPanel,
  useUpdateProjectPanel,
} from '@renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionOperations'
import {
  getErrorMessage,
  getStoryboardPanels,
  isAbortError,
} from './panel-operations-shared'
import { usePanelAssetEditActions } from './usePanelAssetEditActions'

interface UsePanelCrudActionsProps {
  projectId: string
  panelEditsRef: React.MutableRefObject<Record<string, PanelEditData>>
  onRefresh: () => Promise<void> | void
  messages: PanelCrudActionMessages
}

export interface PanelCrudActionMessages {
  unknownError: string
  defaultShotType: string
  defaultCameraMove: string
  newPanelDescription: string
  confirmDeletePanel: string
  addPanelFailed: (error: string) => string
  deletePanelFailed: (error: string) => string
}

export type { PanelSaveState, PanelSaveStatus }

export function usePanelCrudActions({
  projectId,
  panelEditsRef,
  onRefresh,
  messages,
}: UsePanelCrudActionsProps) {
  const [deletingPanelIds, setDeletingPanelIds] = useState<Set<string>>(new Set())

  const savePanelMutation = useUpdateProjectPanel(projectId)
  const createPanelMutation = useCreateProjectPanel(projectId)
  const deletePanelMutation = useDeleteProjectPanel(projectId)

  const {
    savingPanels,
    saveStateByPanel,
    hasUnsavedByPanel,
    savePanel,
    debouncedSave,
    retrySave,
    clearPanelSaveLifecycle,
  } = usePanelSaveLifecycle({
    panelEditsRef,
    runSave: async ({ storyboardId, snapshot }) => {
      await savePanelMutation.mutateAsync({
        storyboardId,
        panelIndex: snapshot.panelIndex,
        id: snapshot.id,
        panelNumber: snapshot.panelNumber,
        shotType: snapshot.shotType,
        cameraMove: snapshot.cameraMove,
        description: snapshot.description,
        location: snapshot.location,
        characters: JSON.stringify(snapshot.characters),
        srtStart: snapshot.srtStart,
        srtEnd: snapshot.srtEnd,
        duration: snapshot.duration,
        videoPrompt: snapshot.videoPrompt,
        photographyRules: snapshot.photographyRules,
        actingNotes: snapshot.actingNotes,
      })
    },
    resolveErrorMessage: (error) => {
      _ulogError('保存失败:', error)
      return getErrorMessage(error, messages.unknownError)
    },
  })
  const {
    addCharacterToPanel,
    removeCharacterFromPanel,
    setPanelLocation,
  } = usePanelAssetEditActions({
    debouncedSave,
  })

  const addPanel = useCallback(async (storyboardId: string) => {
    try {
      await createPanelMutation.mutateAsync({
        storyboardId,
        shotType: messages.defaultShotType,
        cameraMove: messages.defaultCameraMove,
        description: messages.newPanelDescription,
        videoPrompt: '',
        characters: '[]',
      })
      await onRefresh()
    } catch (error: unknown) {
      _ulogError('添加分镜失败:', error)
      alert(messages.addPanelFailed(getErrorMessage(error, messages.unknownError)))
    }
  }, [createPanelMutation, messages, onRefresh])

  const deletePanel = useCallback(async (
    panelId: string,
    storyboardId: string,
    setLocalStoryboards: React.Dispatch<React.SetStateAction<NovelPromotionStoryboard[]>>,
  ) => {
    if (!confirm(messages.confirmDeletePanel)) return
    setDeletingPanelIds((previous) => new Set(previous).add(panelId))

    try {
      await deletePanelMutation.mutateAsync({ panelId })
      setLocalStoryboards((previous) => previous.map((storyboard) => {
        if (storyboard.id !== storyboardId) return storyboard
        const panels = getStoryboardPanels(storyboard)
        const updatedPanels = panels.filter((panel) => panel.id !== panelId)
        return { ...storyboard, panels: updatedPanels }
      }))
    } catch (error: unknown) {
      if (isAbortError(error)) {
        _ulogInfo('请求被中断（可能是页面刷新），后端仍在执行')
        return
      }
      alert(messages.deletePanelFailed(getErrorMessage(error, messages.unknownError)))
    } finally {
      setDeletingPanelIds((previous) => {
        const next = new Set(previous)
        next.delete(panelId)
        return next
      })
      clearPanelSaveLifecycle(panelId)
    }
  }, [clearPanelSaveLifecycle, deletePanelMutation, messages])

  return {
    savingPanels,
    deletingPanelIds,
    saveStateByPanel,
    hasUnsavedByPanel,
    savePanel,
    savePanelWithData: savePanel,
    debouncedSave,
    retrySave,
    addPanel,
    deletePanel,
    addCharacterToPanel,
    removeCharacterFromPanel,
    setPanelLocation,
  }
}
