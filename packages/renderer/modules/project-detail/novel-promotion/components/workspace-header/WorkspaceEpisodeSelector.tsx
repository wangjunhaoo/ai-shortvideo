import { EpisodeSelector } from '@/components/ui/CapsuleNav'
import type { EpisodeSummary } from './types'

interface WorkspaceEpisodeSelectorProps {
  projectName: string
  episodes: EpisodeSummary[]
  currentEpisodeId?: string
  onEpisodeSelect?: (episodeId: string) => void
  onEpisodeCreate?: () => void
  onEpisodeRename?: (episodeId: string, newName: string) => void
  onEpisodeDelete?: (episodeId: string) => void
}

function getEpisodeSortNumber(name: string) {
  const match = name.match(/\d+/)
  return match ? parseInt(match[0], 10) : Infinity
}

export function WorkspaceEpisodeSelector({
  projectName,
  episodes,
  currentEpisodeId,
  onEpisodeSelect,
  onEpisodeCreate,
  onEpisodeRename,
  onEpisodeDelete,
}: WorkspaceEpisodeSelectorProps) {
  if (!(episodes.length > 0 && currentEpisodeId)) {
    return null
  }

  const sortedEpisodes = [...episodes].sort((left, right) => {
    const delta = getEpisodeSortNumber(left.name) - getEpisodeSortNumber(right.name)
    return delta !== 0 ? delta : left.name.localeCompare(right.name, 'zh')
  })

  return (
    <EpisodeSelector
      projectName={projectName}
      episodes={sortedEpisodes.map((episode) => ({
        id: episode.id,
        title: episode.name,
        summary: episode.description ?? undefined,
        status: {
          script: episode.clips?.length ? 'ready' as const : 'empty' as const,
          visual: episode.storyboards?.some((storyboard) => storyboard.panels?.some((panel) => panel.videoUrl)) ? 'ready' as const : 'empty' as const,
        },
      }))}
      currentId={currentEpisodeId}
      onSelect={(id) => onEpisodeSelect?.(id)}
      onAdd={onEpisodeCreate}
      onRename={(id, newName) => onEpisodeRename?.(id, newName)}
      onDelete={onEpisodeDelete}
    />
  )
}
