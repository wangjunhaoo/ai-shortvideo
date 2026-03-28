'use client'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { AppIcon } from '@/components/ui/icons'

export interface VideoToolbarLabels {
  title: string
  totalShotsLabel: (count: number) => string
  generatingShotsLabel: (count: number) => string
  completedShotsLabel: (count: number) => string
  failedShotsLabel: (count: number) => string
  generateAllLabel: string
  noVideosTitle: string
  downloadCountTitle: (count: number) => string
  downloadAllLabel: string
  enterEditorTitle: string
  needVideoTitle: string
  enterEditLabel: string
  backLabel: string
}

interface VideoToolbarProps {
  totalPanels: number
  runningCount: number
  videosWithUrl: number
  failedCount: number
  isAnyTaskRunning: boolean
  isDownloading: boolean
  onGenerateAll: () => void
  onDownloadAll: () => void
  onBack: () => void
  onEnterEditor?: () => void  // 进入剪辑器
  videosReady?: boolean  // 是否有视频可以剪辑
  labels: VideoToolbarLabels
}

export default function VideoToolbar({
  totalPanels,
  runningCount,
  videosWithUrl,
  failedCount,
  isAnyTaskRunning,
  isDownloading,
  onGenerateAll,
  onDownloadAll,
  onBack,
  onEnterEditor,
  videosReady = false,
  labels,
}: VideoToolbarProps) {
  const videoTaskRunningState = isAnyTaskRunning
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'generate',
      resource: 'video',
      hasOutput: videosWithUrl > 0,
    })
    : null
  const videoDownloadState = isDownloading
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'generate',
      resource: 'video',
      hasOutput: videosWithUrl > 0,
    })
    : null
  return (
    <div className="glass-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-[var(--glass-text-secondary)]">
             {labels.title}
          </span>
          <span className="text-sm text-[var(--glass-text-tertiary)]">
            {labels.totalShotsLabel(totalPanels)}
            {runningCount > 0 && (
              <span className="text-[var(--glass-tone-info-fg)] ml-2 animate-pulse">({labels.generatingShotsLabel(runningCount)})</span>
            )}
            {videosWithUrl > 0 && (
              <span className="text-[var(--glass-tone-success-fg)] ml-2">({labels.completedShotsLabel(videosWithUrl)})</span>
            )}
            {failedCount > 0 && (
              <span className="text-[var(--glass-tone-danger-fg)] ml-2">({labels.failedShotsLabel(failedCount)})</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onGenerateAll}
            disabled={isAnyTaskRunning}
            className="glass-btn-base glass-btn-primary flex items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnyTaskRunning ? (
              <TaskStatusInline state={videoTaskRunningState} className="text-white [&>span]:text-white [&_svg]:text-white" />
            ) : (
              <>
                <AppIcon name="plus" className="w-4 h-4" />
                <span>{labels.generateAllLabel}</span>
              </>
            )}
          </button>
          <button
            onClick={onDownloadAll}
            disabled={videosWithUrl === 0 || isDownloading}
            className="glass-btn-base glass-btn-tone-info flex items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={videosWithUrl === 0 ? labels.noVideosTitle : labels.downloadCountTitle(videosWithUrl)}
          >
            {isDownloading ? (
              <TaskStatusInline state={videoDownloadState} className="text-white [&>span]:text-white [&_svg]:text-white" />
            ) : (
              <>
                <AppIcon name="image" className="w-4 h-4" />
                <span>{labels.downloadAllLabel}</span>
              </>
            )}
          </button>
          {onEnterEditor && (
            <button
              onClick={onEnterEditor}
              disabled={!videosReady}
              className="glass-btn-base glass-btn-secondary flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--glass-stroke-base)] disabled:opacity-50 disabled:cursor-not-allowed"
              title={videosReady ? labels.enterEditorTitle : labels.needVideoTitle}
            >
              <AppIcon name="wandOff" className="w-4 h-4" />
              <span>{labels.enterEditLabel}</span>
            </button>
          )}
          <button
            onClick={onBack}
            className="glass-btn-base glass-btn-secondary flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--glass-stroke-base)] hover:text-[var(--glass-tone-info-fg)]"
          >
            <AppIcon name="chevronLeft" className="w-4 h-4" />
            <span>{labels.backLabel}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
