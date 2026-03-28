import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { resolveSelectedEpisodeId } from './episode-selection'
import { VALID_STAGES, type Episode, type NovelPromotionData, type Stage } from './detail-types'

export function useProjectDetailRouteState(
  projectId: string,
  projectReady: boolean,
  novelPromotionData: NovelPromotionData | undefined,
) {
  const router = useRouter()
  const searchParams = useSearchParams()
  if (!searchParams) {
    throw new Error('ProjectDetailPage requires searchParams')
  }
  const [isGlobalAssetsView, setIsGlobalAssetsView] = useState(false)

  const urlStage = searchParams.get('stage') as Stage | null
  const urlEpisodeId = searchParams.get('episode') ?? null
  const currentUrlStage = urlStage && VALID_STAGES.includes(urlStage) ? urlStage : null
  const effectiveStage = currentUrlStage === 'editor' ? 'videos' : (currentUrlStage || 'config')

  const episodes = useMemo<Episode[]>(() => {
    const getNum = (name: string) => {
      const match = name.match(/\d+/)
      return match ? parseInt(match[0], 10) : Infinity
    }
    return [...(novelPromotionData?.episodes ?? [])].sort((a, b) => {
      const diff = getNum(a.name) - getNum(b.name)
      return diff !== 0 ? diff : a.name.localeCompare(b.name, 'zh')
    })
  }, [novelPromotionData?.episodes])

  const selectedEpisodeId = useMemo(
    () => resolveSelectedEpisodeId(episodes, urlEpisodeId),
    [episodes, urlEpisodeId],
  )

  const importStatus = novelPromotionData?.importStatus
  const isZeroState = episodes.length === 0
  const shouldShowImportWizard = isZeroState || importStatus === 'pending'
  const shouldGateImportWizardByModel = shouldShowImportWizard && !isGlobalAssetsView

  const updateUrlParams = useCallback((updates: { stage?: string; episode?: string | null }) => {
    const params = new URLSearchParams(searchParams.toString())
    if (updates.stage !== undefined) {
      params.set('stage', updates.stage)
    }
    if (updates.episode !== undefined) {
      if (updates.episode) {
        params.set('episode', updates.episode)
      } else {
        params.delete('episode')
      }
    }
    const query = Object.fromEntries(params.entries())
    router.replace(
      {
        pathname: `/workspace/${projectId}`,
        query,
      },
      { scroll: false },
    )
  }, [projectId, router, searchParams])

  const updateUrlStage = useCallback((stage: string) => {
    updateUrlParams({ stage })
  }, [updateUrlParams])

  useEffect(() => {
    if (!projectReady || isGlobalAssetsView || episodes.length === 0) return
    if (urlEpisodeId && episodes.some((episode) => episode.id === urlEpisodeId)) return
    if (selectedEpisodeId) {
      updateUrlParams({ episode: selectedEpisodeId })
    }
  }, [episodes, isGlobalAssetsView, projectReady, selectedEpisodeId, updateUrlParams, urlEpisodeId])

  const handleEpisodeSelect = useCallback((episodeId: string) => {
    setIsGlobalAssetsView(false)
    updateUrlParams({ episode: episodeId })
  }, [updateUrlParams])

  return {
    projectId,
    isGlobalAssetsView,
    setIsGlobalAssetsView,
    episodes,
    selectedEpisodeId,
    importStatus,
    shouldShowImportWizard,
    shouldGateImportWizardByModel,
    effectiveStage,
    updateUrlParams,
    updateUrlStage,
    handleEpisodeSelect,
  }
}
