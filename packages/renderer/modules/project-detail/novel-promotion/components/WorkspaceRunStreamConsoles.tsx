'use client'

import { RunStreamConsoleOverlay } from './run-stream-console/RunStreamConsoleOverlay'
import type { RunStreamState } from './run-stream-console/types'

interface WorkspaceRunStreamConsoleLabels {
  storyToScriptTitle: string
  storyToScriptSubtitle: string
  storyToScriptRunningLabel: string
  scriptToStoryboardTitle: string
  scriptToStoryboardSubtitle: string
  scriptToStoryboardRunningLabel: string
  stopLabel: string
  minimizeLabel: string
}

interface WorkspaceRunStreamConsolesProps {
  storyToScriptStream: RunStreamState
  scriptToStoryboardStream: RunStreamState
  storyToScriptConsoleMinimized: boolean
  scriptToStoryboardConsoleMinimized: boolean
  onStoryToScriptMinimizedChange: (next: boolean) => void
  onScriptToStoryboardMinimizedChange: (next: boolean) => void
  hideMinimizedBadges?: boolean
  labels: WorkspaceRunStreamConsoleLabels
}

export default function WorkspaceRunStreamConsoles({
  storyToScriptStream,
  scriptToStoryboardStream,
  storyToScriptConsoleMinimized,
  scriptToStoryboardConsoleMinimized,
  onStoryToScriptMinimizedChange,
  onScriptToStoryboardMinimizedChange,
  hideMinimizedBadges,
  labels,
}: WorkspaceRunStreamConsolesProps) {
  return (
    <>
      <RunStreamConsoleOverlay
        stream={storyToScriptStream}
        minimized={storyToScriptConsoleMinimized}
        onMinimizedChange={onStoryToScriptMinimizedChange}
        hideMinimizedBadge={hideMinimizedBadges}
        defaultStageId="story_to_script_run"
        defaultTitle={labels.storyToScriptTitle}
        subtitle={labels.storyToScriptSubtitle}
        runningBadgeLabel={labels.storyToScriptRunningLabel}
        minimizedBadgeClassName="fixed right-6 bottom-6 z-120 glass-surface-modal rounded-2xl px-4 py-3 text-sm font-medium text-(--glass-tone-info-fg)"
        stopLabel={labels.stopLabel}
        minimizeLabel={labels.minimizeLabel}
      />

      <RunStreamConsoleOverlay
        stream={scriptToStoryboardStream}
        minimized={scriptToStoryboardConsoleMinimized}
        onMinimizedChange={onScriptToStoryboardMinimizedChange}
        hideMinimizedBadge={hideMinimizedBadges}
        defaultStageId="script_to_storyboard_run"
        defaultTitle={labels.scriptToStoryboardTitle}
        subtitle={labels.scriptToStoryboardSubtitle}
        runningBadgeLabel={labels.scriptToStoryboardRunningLabel}
        minimizedBadgeClassName="fixed right-6 bottom-20 z-120 glass-surface-modal rounded-2xl px-4 py-3 text-sm font-medium text-(--glass-tone-info-fg)"
        stopLabel={labels.stopLabel}
        minimizeLabel={labels.minimizeLabel}
      />
    </>
  )
}
