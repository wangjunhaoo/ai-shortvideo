'use client'

import { Link } from '@/i18n/navigation'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { AppIcon, IconGradientDefs } from '@/components/ui/icons'
import { formatProjectDate } from './format-project-date'
import type { Project } from './types'

type WorkspaceProjectsSectionProps = {
  loading: boolean
  projects: Project[]
  deletingProjectId: string | null
  searchQuery: string
  onCreateProject: () => void
  onEditProject: (project: Project, event: React.MouseEvent) => void
  onDeleteProject: (project: Project, event: React.MouseEvent) => void
  t: (key: string, values?: Record<string, string | number | Date>) => string
}

export function WorkspaceProjectsSection({
  loading,
  projects,
  deletingProjectId,
  searchQuery,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  t,
}: WorkspaceProjectsSectionProps) {
  const hasProjects = projects.length > 0

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          onClick={onCreateProject}
          className="glass-surface p-6 cursor-pointer group flex items-center justify-center bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-blue-600/5 hover:from-blue-500/10 hover:via-cyan-500/10 hover:to-blue-600/10 transition-all duration-300"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 group-hover:scale-110 transition-all duration-300">
              <AppIcon name="plus" className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-[var(--glass-text-secondary)] group-hover:text-[var(--glass-text-primary)] transition-colors">
              {t('newProject')}
            </span>
          </div>
        </div>

        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="glass-surface p-6 animate-pulse">
              <div className="h-4 bg-[var(--glass-bg-muted)] rounded mb-3" />
              <div className="h-3 bg-[var(--glass-bg-muted)] rounded mb-2" />
              <div className="h-3 bg-[var(--glass-bg-muted)] rounded w-2/3" />
            </div>
          ))
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              href={{ pathname: `/workspace/${project.id}` }}
              className="glass-surface cursor-pointer relative group block hover:border-[var(--glass-tone-info-fg)]/40 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="p-5 relative z-10">
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={(event) => onEditProject(project, event)}
                    className="glass-btn-base glass-btn-secondary p-2 rounded-lg transition-colors"
                    title={t('editProject')}
                  >
                    <AppIcon name="editSquare" className="w-4 h-4 text-[var(--glass-tone-info-fg)]" />
                  </button>
                  <button
                    onClick={(event) => onDeleteProject(project, event)}
                    className="glass-btn-base glass-btn-secondary p-2 rounded-lg transition-colors"
                    title={t('deleteProject')}
                    disabled={deletingProjectId === project.id}
                  >
                    {deletingProjectId === project.id ? (
                      <TaskStatusInline
                        state={resolveTaskPresentationState({
                          phase: 'processing',
                          intent: 'process',
                          resource: 'text',
                          hasOutput: true,
                        })}
                        className="[&>span]:sr-only"
                      />
                    ) : (
                      <AppIcon name="trash" className="w-4 h-4 text-[var(--glass-tone-danger-fg)]" />
                    )}
                  </button>
                </div>

                <h3 className="text-lg font-bold text-[var(--glass-text-primary)] mb-2 line-clamp-2 pr-20 group-hover:text-[var(--glass-tone-info-fg)] transition-colors">
                  {project.name}
                </h3>

                {(project.description || project.stats?.firstEpisodePreview) && (
                  <div className="flex items-start gap-2 mb-4">
                    <AppIcon name="fileText" className="w-4 h-4 text-[var(--glass-text-tertiary)] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 leading-relaxed">
                      {project.description || project.stats?.firstEpisodePreview}
                    </p>
                  </div>
                )}

                {project.stats && (project.stats.episodes > 0 || project.stats.images > 0 || project.stats.videos > 0) ? (
                  <div className="flex items-center gap-2 mb-3">
                    <IconGradientDefs className="w-0 h-0 absolute" aria-hidden="true" />
                    <AppIcon name="statsBarGradient" className="w-4 h-4 flex-shrink-0" />
                    <div className="flex items-center gap-3 text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                      {project.stats.episodes > 0 && (
                        <span className="flex items-center gap-1" title={t('statsEpisodes')}>
                          <AppIcon name="statsEpisodeGradient" className="w-3.5 h-3.5" />
                          {project.stats.episodes}
                        </span>
                      )}
                      {project.stats.images > 0 && (
                        <span className="flex items-center gap-1" title={t('statsImages')}>
                          <AppIcon name="statsImageGradient" className="w-3.5 h-3.5" />
                          {project.stats.images}
                        </span>
                      )}
                      {project.stats.videos > 0 && (
                        <span className="flex items-center gap-1" title={t('statsVideos')}>
                          <AppIcon name="statsVideoGradient" className="w-3.5 h-3.5" />
                          {project.stats.videos}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 mb-3">
                    <AppIcon name="statsBar" className="w-4 h-4 text-[var(--glass-text-tertiary)] flex-shrink-0" />
                    <span className="text-xs text-[var(--glass-text-tertiary)]">{t('noContent')}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-[var(--glass-text-tertiary)]">
                  <div className="flex items-center gap-1">
                    <AppIcon name="clock" className="w-3 h-3" />
                    {formatProjectDate(project.updatedAt)}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {!loading && !hasProjects && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[var(--glass-bg-muted)] rounded-xl flex items-center justify-center mx-auto mb-4">
            <AppIcon name="folderCards" className="w-8 h-8 text-[var(--glass-text-tertiary)]" />
          </div>
          <h3 className="text-lg font-medium text-[var(--glass-text-primary)] mb-2">
            {searchQuery ? t('noResults') : t('noProjects')}
          </h3>
          <p className="text-[var(--glass-text-secondary)] mb-6">
            {searchQuery ? t('noResultsDesc') : t('noProjectsDesc')}
          </p>
          {!searchQuery && (
            <button
              onClick={onCreateProject}
              className="glass-btn-base glass-btn-primary px-6 py-3"
            >
              {t('newProject')}
            </button>
          )}
        </div>
      )}
    </>
  )
}
