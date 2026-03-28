'use client'

import { logError as _ulogError } from '@/lib/logging/core'
import { useState, useCallback, useEffect } from 'react'
import { NovelPromotionStoryboard } from '@/types/project'
import { useRefreshProjectAssets } from '@renderer/hooks/useRendererProjectQueries'
import {
  usePanelCandidates,
  type PanelCandidateMessages,
} from './usePanelCandidates'
import {
  useClearProjectStoryboardError,
  useRefreshEpisodeData,
  useRefreshStoryboards,
  useRegenerateProjectPanelImage,
  useModifyProjectStoryboardImage,
  useDownloadProjectImages,
} from '@renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionOperations'
import {
  getStoryboardPanels,
  reconcileModifyingPanelIds,
  reconcileSubmittingPanelImageIds,
} from './image-generation-runtime'
import { usePanelImageRegeneration } from './usePanelImageRegeneration'
import {
  usePanelImageModification,
  type PanelImageModificationMessages,
} from './usePanelImageModification'
import {
  usePanelImageDownload,
  type PanelImageDownloadMessages,
} from './usePanelImageDownload'

export interface SelectedAsset {
  id: string
  name: string
  type: 'character' | 'location'
  imageUrl: string | null
  appearanceId?: number
  appearanceName?: string
}

interface UseStoryboardImageGenerationProps {
  projectId: string
  episodeId?: string
  localStoryboards: NovelPromotionStoryboard[]
  setLocalStoryboards: React.Dispatch<React.SetStateAction<NovelPromotionStoryboard[]>>
  messages: {
    candidates: PanelCandidateMessages
    imageModification: PanelImageModificationMessages
    imageDownload: PanelImageDownloadMessages
  }
}

export function useStoryboardImageGeneration({
  projectId,
  episodeId,
  localStoryboards,
  setLocalStoryboards,
  messages,
}: UseStoryboardImageGenerationProps) {
  const onSilentRefresh = useRefreshProjectAssets(projectId)
  const refreshEpisode = useRefreshEpisodeData(projectId, episodeId ?? null)
  const refreshStoryboards = useRefreshStoryboards(episodeId ?? null)
  const regeneratePanelMutation = useRegenerateProjectPanelImage(projectId)
  const modifyPanelMutation = useModifyProjectStoryboardImage(projectId)
  const downloadImagesMutation = useDownloadProjectImages(projectId)
  const clearStoryboardErrorMutation = useClearProjectStoryboardError(projectId)

  const submittingStoryboardIds = new Set<string>(
    localStoryboards
      .filter((storyboard) => storyboard.storyboardTaskRunning)
      .map((storyboard) => storyboard.id),
  )

  const [submittingPanelImageIds, setSubmittingPanelImageIds] = useState<Set<string>>(new Set())
  const [selectingCandidateIds] = useState<Set<string>>(new Set())
  const [editingPanel, setEditingPanel] = useState<{ storyboardId: string; panelIndex: number } | null>(null)
  const [modifyingPanels, setModifyingPanels] = useState<Set<string>>(new Set())
  const [isDownloadingImages, setIsDownloadingImages] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const {
    panelCandidateIndex,
    setPanelCandidateIndex,
    getPanelCandidates,
    ensurePanelCandidatesInitialized,
    selectPanelCandidateIndex,
    confirmPanelCandidate,
    cancelPanelCandidate,
  } = usePanelCandidates({
    projectId,
    episodeId,
    messages: messages.candidates,
    onConfirmed: (panelId, confirmedImageUrl) => {
      setLocalStoryboards((previousStoryboards) =>
        previousStoryboards.map((storyboard) => {
          const panels = getStoryboardPanels(storyboard)
          let changed = false
          const updatedPanels = panels.map((panel) => {
            if (panel.id !== panelId) return panel
            changed = true
            return {
              ...panel,
              imageUrl: confirmedImageUrl ?? panel.imageUrl,
              candidateImages: null,
              imageTaskRunning: false,
            }
          })
          return changed ? { ...storyboard, panels: updatedPanels } : storyboard
        }),
      )
    },
  })

  useEffect(() => {
    localStoryboards.forEach((storyboard) => {
      getStoryboardPanels(storyboard).forEach((panel) => {
        ensurePanelCandidatesInitialized(panel)
      })
    })
  }, [ensurePanelCandidatesInitialized, localStoryboards])

  useEffect(() => {
    if (submittingPanelImageIds.size === 0) return
    setSubmittingPanelImageIds((previousIds) =>
      reconcileSubmittingPanelImageIds(previousIds, localStoryboards),
    )
  }, [localStoryboards, submittingPanelImageIds.size])

  useEffect(() => {
    if (modifyingPanels.size === 0) return
    setModifyingPanels((previousIds) => reconcileModifyingPanelIds(previousIds, localStoryboards))
  }, [localStoryboards, modifyingPanels.size])

  const { regeneratePanelImage, regenerateAllPanelsIndividually } = usePanelImageRegeneration({
    localStoryboards,
    setLocalStoryboards,
    submittingPanelImageIds,
    setSubmittingPanelImageIds,
    onSilentRefresh,
    refreshEpisode,
    refreshStoryboards,
    regeneratePanelMutation,
    selectPanelCandidateIndex,
  })

  const { modifyPanelImage } = usePanelImageModification({
    localStoryboards,
    setLocalStoryboards,
    modifyPanelMutation,
    setModifyingPanels,
    onSilentRefresh,
    refreshEpisode,
    refreshStoryboards,
    messages: messages.imageModification,
  })

  const { downloadAllImages } = usePanelImageDownload({
    localStoryboards,
    downloadImagesMutation,
    setIsDownloadingImages,
    messages: messages.imageDownload,
  })

  const clearStoryboardError = useCallback(async (storyboardId: string) => {
    let snapshot: NovelPromotionStoryboard[] | null = null
    setLocalStoryboards((previousStoryboards) =>
      {
        snapshot = previousStoryboards
        return previousStoryboards.map((storyboard) =>
        storyboard.id === storyboardId ? { ...storyboard, lastError: null } : storyboard,
      )
      },
    )

    try {
      await clearStoryboardErrorMutation.mutateAsync({ storyboardId })
      if (onSilentRefresh) {
        await onSilentRefresh()
      }
      refreshEpisode()
      refreshStoryboards()
    } catch (error: unknown) {
      if (snapshot) {
        setLocalStoryboards(snapshot)
      }
      _ulogError('[clearStoryboardError] persist failed:', error)
    }
  }, [
    clearStoryboardErrorMutation,
    onSilentRefresh,
    refreshEpisode,
    refreshStoryboards,
    setLocalStoryboards,
  ])

  return {
    submittingStoryboardIds,
    submittingPanelImageIds,
    selectingCandidateIds,
    panelCandidateIndex,
    setPanelCandidateIndex,
    editingPanel,
    setEditingPanel,
    modifyingPanels,
    isDownloadingImages,
    previewImage,
    setPreviewImage,
    regeneratePanelImage,
    regenerateAllPanelsIndividually,
    selectPanelCandidate: confirmPanelCandidate,
    selectPanelCandidateIndex,
    cancelPanelCandidate,
    getPanelCandidates,
    modifyPanelImage,
    downloadAllImages,
    clearStoryboardError,
  }
}
