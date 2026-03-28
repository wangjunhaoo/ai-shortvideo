import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@/i18n/navigation'
import {
  createNovelPromotionEpisode,
  deleteNovelPromotionEpisode,
  getProjectData,
  updateNovelPromotionEpisode,
} from '@renderer/clients/project-client'
import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'
import { queryKeys } from '@/lib/query/keys'
import type { SplitEpisode } from '@renderer/modules/project-detail/novel-promotion/components/SmartImportWizard'
import type { Episode, TranslationFn } from './detail-types'

type UseProjectDetailEpisodeActionsInput = {
  projectId: string
  selectedEpisodeId: string | null
  episodes: Episode[]
  updateUrlParams: (updates: { stage?: string; episode?: string | null }) => void
  setIsGlobalAssetsView: (value: boolean) => void
  t: TranslationFn
}

export function useProjectDetailEpisodeActions({
  projectId,
  selectedEpisodeId,
  episodes,
  updateUrlParams,
  setIsGlobalAssetsView,
  t,
}: UseProjectDetailEpisodeActionsInput) {
  const queryClient = useQueryClient()
  const router = useRouter()

  const handleCreateEpisode = useCallback(async (name: string, description?: string) => {
    const response = await createNovelPromotionEpisode(projectId, { name, description })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || t('createFailed'))
    }

    const data = await response.json()
    queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) })
    setIsGlobalAssetsView(false)
    updateUrlParams({ episode: data.episode.id })
  }, [projectId, queryClient, setIsGlobalAssetsView, t, updateUrlParams])

  const handleSmartImportComplete = useCallback(async (
    splitEpisodes: SplitEpisode[],
    triggerGlobalAnalysis?: boolean,
  ) => {
    void splitEpisodes
    _ulogInfo('[Page] handleSmartImportComplete 被调用，triggerGlobalAnalysis:', triggerGlobalAnalysis)

    try {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) })

      const response = await getProjectData(projectId)
      const data = await response.json()
      const newEpisodes = data?.project?.novelPromotionData?.episodes || []
      _ulogInfo('[Page] 获取到新剧集:', newEpisodes.length, '个')

      if (newEpisodes.length > 0) {
        if (triggerGlobalAnalysis) {
          _ulogInfo('[Page] 触发全局分析，跳转到 assets 阶段，带 globalAnalyze=1 参数')
          const params = new URLSearchParams()
          params.set('stage', 'assets')
          params.set('episode', newEpisodes[0].id)
          params.set('globalAnalyze', '1')
          router.replace(`?${params.toString()}`, { scroll: false })
        } else {
          _ulogInfo('[Page] 不触发全局分析，只更新 episode 参数')
          updateUrlParams({ episode: newEpisodes[0].id })
        }
      }
    } catch (error) {
      _ulogError('刷新失败:', error)
    }
  }, [projectId, queryClient, router, updateUrlParams])

  const handleRenameEpisode = useCallback(async (episodeId: string, newName: string) => {
    const response = await updateNovelPromotionEpisode(projectId, episodeId, { name: newName })

    if (!response.ok) {
      throw new Error(t('renameFailed'))
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) })
    if (selectedEpisodeId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.episodeData(projectId, selectedEpisodeId),
      })
    }
  }, [projectId, queryClient, selectedEpisodeId, t])

  const handleDeleteEpisode = useCallback(async (episodeId: string) => {
    const response = await deleteNovelPromotionEpisode(projectId, episodeId)
    if (!response.ok) {
      throw new Error(t('deleteFailed'))
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.projectData(projectId) })
    if (episodeId === selectedEpisodeId) {
      const remaining = episodes.filter((episode) => episode.id !== episodeId)
      if (remaining.length > 0) {
        updateUrlParams({ episode: remaining[0].id })
      } else {
        updateUrlParams({ episode: null })
      }
    }
  }, [episodes, projectId, queryClient, selectedEpisodeId, t, updateUrlParams])

  return {
    handleCreateEpisode,
    handleSmartImportComplete,
    handleRenameEpisode,
    handleDeleteEpisode,
  }
}
