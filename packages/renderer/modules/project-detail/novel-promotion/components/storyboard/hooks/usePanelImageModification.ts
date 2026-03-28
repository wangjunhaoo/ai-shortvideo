'use client'
import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'

import { useCallback } from 'react'
import type { NovelPromotionStoryboard } from '@/types/project'
import { extractErrorMessage } from '@/lib/errors/extract'
import type { SelectedAsset } from './useImageGeneration'
import {
  StoryboardImageMutationResult,
  getStoryboardPanels,
  isAbortError,
  updatePanelImageUrlInStoryboards,
} from './image-generation-runtime'

interface ModifyPanelMutationLike {
  mutateAsync: (payload: {
    storyboardId: string
    panelIndex: number
    modifyPrompt: string
    extraImageUrls: string[]
    selectedAssets: SelectedAsset[]
  }) => Promise<unknown>
}

interface UsePanelImageModificationParams {
  localStoryboards: NovelPromotionStoryboard[]
  setLocalStoryboards: React.Dispatch<React.SetStateAction<NovelPromotionStoryboard[]>>
  modifyPanelMutation: ModifyPanelMutationLike
  setModifyingPanels: React.Dispatch<React.SetStateAction<Set<string>>>
  onSilentRefresh?: (() => void | Promise<void>) | null
  refreshEpisode: () => void
  refreshStoryboards: () => void
  messages: PanelImageModificationMessages
}

export interface PanelImageModificationMessages {
  panelNotFound: string
  unknownError: string
  modifyFailed: (error: string) => string
}

export function usePanelImageModification({
  localStoryboards,
  setLocalStoryboards,
  modifyPanelMutation,
  setModifyingPanels,
  onSilentRefresh,
  refreshEpisode,
  refreshStoryboards,
  messages,
}: UsePanelImageModificationParams) {
  const modifyPanelImage = useCallback(
    async (
      storyboardId: string,
      panelIndex: number,
      prompt: string,
      images: string[],
      assets: SelectedAsset[],
    ) => {
      const storyboard = localStoryboards.find((item) => item.id === storyboardId)
      const panels = storyboard ? getStoryboardPanels(storyboard) : []
      const panel = panels[panelIndex]
      const panelId = panel?.id

      if (!panelId) {
        _ulogError('[modifyPanelImage] Panel not found:', { storyboardId, panelIndex })
        alert(messages.panelNotFound)
        return
      }

      setModifyingPanels((previous) => new Set(previous).add(panelId))
      let isAsync = false
      try {
        const data = await modifyPanelMutation.mutateAsync({
          storyboardId,
          panelIndex,
          modifyPrompt: prompt,
          extraImageUrls: images,
          selectedAssets: assets,
        })
        const result = (data || {}) as StoryboardImageMutationResult

        if (result.async) {
          _ulogInfo(`[Modify Panel] 异步任务已提交: ${panelId}`)
          isAsync = true
          if (onSilentRefresh) {
            await onSilentRefresh()
          }
          refreshEpisode()
          refreshStoryboards()
          return
        }

        if (result.imageUrl) {
          setLocalStoryboards((previous) =>
            updatePanelImageUrlInStoryboards(previous, storyboardId, panelIndex, result.imageUrl as string),
          )
        }
      } catch (error: unknown) {
      if (isAbortError(error)) {
        _ulogInfo('请求被中断（可能是页面刷新），后端仍在执行')
        return
      }
      alert(messages.modifyFailed(extractErrorMessage(error, messages.unknownError)))
    } finally {
        if (!isAsync) {
          setModifyingPanels((previous) => {
            const next = new Set(previous)
            next.delete(panelId)
            return next
          })
        }
      }
    },
    [
      localStoryboards,
      modifyPanelMutation,
      messages,
      onSilentRefresh,
      refreshEpisode,
      refreshStoryboards,
      setLocalStoryboards,
      setModifyingPanels,
    ],
  )

  return {
    modifyPanelImage,
  }
}
