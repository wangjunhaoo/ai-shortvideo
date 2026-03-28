'use client'
import { useTranslations } from 'next-intl'
import Navbar from '@/components/Navbar'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import NovelPromotionWorkspace from '@renderer/modules/project-detail/novel-promotion/NovelPromotionWorkspace'
import { ProjectDetailImportGate } from '@renderer/modules/project-detail/ProjectDetailImportGate'
import {
  ProjectDetailErrorView,
  ProjectDetailLoadingView,
} from '@renderer/modules/project-detail/ProjectDetailStateViews'
import { useProjectDetailPageState } from '@renderer/modules/project-detail/useProjectDetailPageState'
import { type Episode } from '@renderer/modules/project-detail/detail-types'
import { useRouter } from '@/i18n/navigation'

/**
 * 项目详情页 - 带侧边栏的剧集管理
 */
export default function ProjectDetailPage() {
  const router = useRouter()
  const t = useTranslations('workspaceDetail')
  const tc = useTranslations('common')
  const pageState = useProjectDetailPageState(t)

  if (pageState.isInitializing) {
    return <ProjectDetailLoadingView tc={tc} />
  }

  if (pageState.error || !pageState.project) {
    return (
      <ProjectDetailErrorView
        message={pageState.error || t('projectNotFound')}
        onBack={() => router.push({ pathname: '/workspace' })}
        t={t}
      />
    )
  }

  return (
    <div className="glass-page min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          {pageState.detailRouteState.isGlobalAssetsView && pageState.project.novelPromotionData ? (
            <div>
              <h1 className="text-2xl font-bold text-[var(--glass-text-primary)] mb-6">{t('globalAssets')}</h1>
              <NovelPromotionWorkspace
                project={pageState.project}
                projectId={pageState.projectId}
                viewMode="global-assets"
                urlStage={pageState.detailRouteState.effectiveStage}
                onStageChange={pageState.detailRouteState.updateUrlStage}
              />
            </div>
          ) : pageState.detailRouteState.shouldShowImportWizard && !pageState.detailRouteState.isGlobalAssetsView ? (
            <ProjectDetailImportGate
              isCheckingModelSetup={pageState.modelSetup.isCheckingModelSetup}
              needsModelSetup={pageState.modelSetup.needsModelSetup}
              isModelSetupModalOpen={pageState.modelSetup.isModelSetupModalOpen}
              modelSetupSaving={pageState.modelSetup.modelSetupSaving}
              llmModelOptions={pageState.modelSetup.llmModelOptions}
              analysisModelDraft={pageState.modelSetup.analysisModelDraft}
              importStatus={pageState.detailRouteState.importStatus}
              projectId={pageState.projectId}
              initLoadingState={pageState.initLoadingState}
              onOpenModelSetup={() => pageState.modelSetup.setIsModelSetupModalOpen(true)}
              onCloseModelSetup={() => pageState.modelSetup.setIsModelSetupModalOpen(false)}
              onGoProfile={() => router.push({ pathname: '/profile' })}
              onAnalysisModelDraftChange={pageState.modelSetup.setAnalysisModelDraft}
              onSaveDefaultAnalysisModel={() => { void pageState.modelSetup.handleSaveDefaultAnalysisModel() }}
              onManualCreate={() => { void pageState.episodeActions.handleCreateEpisode(`${t('episode')} 1`) }}
              onImportComplete={pageState.episodeActions.handleSmartImportComplete}
              t={t}
              tc={tc}
            />
          ) : pageState.detailRouteState.selectedEpisodeId && pageState.currentEpisode ? (
            <NovelPromotionWorkspace
              project={pageState.project}
              projectId={pageState.projectId}
              episodeId={pageState.detailRouteState.selectedEpisodeId}
              episode={pageState.currentEpisode as Episode}
              viewMode="episode"
              urlStage={pageState.detailRouteState.effectiveStage}
              onStageChange={pageState.detailRouteState.updateUrlStage}
              episodes={pageState.detailRouteState.episodes}
              onEpisodeSelect={pageState.detailRouteState.handleEpisodeSelect}
              onEpisodeCreate={() => pageState.episodeActions.handleCreateEpisode(`${t('episode')} ${pageState.detailRouteState.episodes.length + 1}`)}
              onEpisodeRename={pageState.episodeActions.handleRenameEpisode}
              onEpisodeDelete={pageState.episodeActions.handleDeleteEpisode}
            />
          ) : (
            <div className="glass-surface p-8 text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center bg-[var(--glass-bg-muted)] text-[var(--glass-text-tertiary)]">
                <TaskStatusInline state={pageState.initLoadingState} className="[&>span]:sr-only" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--glass-text-secondary)] mb-2">{tc('loading')}</h2>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
