'use client'

import { useParams } from 'next/navigation'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { useEpisodeData, useProjectData } from '@renderer/hooks/useRendererProjectQueries'
import { useProjectDetailEpisodeActions } from './useProjectDetailEpisodeActions'
import { useProjectDetailModelSetup } from './useProjectDetailModelSetup'
import { useProjectDetailRouteState } from './useProjectDetailRouteState'
import type { NovelPromotionData, TranslationFn } from './detail-types'

export function useProjectDetailPageState(t: TranslationFn) {
  const params = useParams<{ projectId?: string }>()
  if (!params?.projectId) {
    throw new Error('ProjectDetailPage requires projectId route param')
  }
  const projectId = params.projectId

  const { data: project, isLoading: loading, error: projectError } = useProjectData(projectId)
  const error = projectError?.message || null
  const novelPromotionData = project?.novelPromotionData as NovelPromotionData | undefined

  const detailRouteState = useProjectDetailRouteState(projectId, !!project, novelPromotionData)
  const { data: currentEpisode } = useEpisodeData(
    projectId,
    !detailRouteState.isGlobalAssetsView ? detailRouteState.selectedEpisodeId : null,
  )

  const modelSetup = useProjectDetailModelSetup(
    detailRouteState.shouldGateImportWizardByModel,
    t,
  )
  const episodeActions = useProjectDetailEpisodeActions({
    projectId,
    selectedEpisodeId: detailRouteState.selectedEpisodeId,
    episodes: detailRouteState.episodes,
    updateUrlParams: detailRouteState.updateUrlParams,
    setIsGlobalAssetsView: detailRouteState.setIsGlobalAssetsView,
    t,
  })

  const isInitializing = loading
    || (!detailRouteState.shouldShowImportWizard
      && !detailRouteState.isGlobalAssetsView
      && detailRouteState.episodes.length > 0
      && (!detailRouteState.selectedEpisodeId || !currentEpisode))
    || (project && !project.novelPromotionData)

  const initLoadingState = resolveTaskPresentationState({
    phase: 'processing',
    intent: 'generate',
    resource: 'text',
    hasOutput: false,
  })

  return {
    projectId,
    project,
    currentEpisode,
    error,
    detailRouteState,
    modelSetup,
    episodeActions,
    isInitializing,
    initLoadingState,
  }
}
