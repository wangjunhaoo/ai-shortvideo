import { listRuns } from '@renderer/clients/run-client'

type RunRecord = {
  id?: unknown
}

type RunsResponse = {
  runs?: RunRecord[]
}

export async function resolveActiveNovelPromotionRunId(params: {
  projectId: string
  workflowType: string
  episodeId?: string | null
}) {
  if (!params.episodeId) return null

  const search = new URLSearchParams({
    projectId: params.projectId,
    workflowType: params.workflowType,
    targetType: 'NovelPromotionEpisode',
    targetId: params.episodeId,
    episodeId: params.episodeId,
    limit: '20',
  })
  search.append('status', 'queued')
  search.append('status', 'running')
  search.append('status', 'canceling')
  search.set('_v', '2')

  const response = await listRuns(search)
  if (!response.ok) return null

  const data = await response.json().catch(() => null)
  const runs =
    data && typeof data === 'object' && Array.isArray((data as RunsResponse).runs)
      ? ((data as RunsResponse).runs as RunRecord[])
      : []

  for (const run of runs) {
    if (typeof run?.id === 'string' && run.id.trim()) {
      return run.id.trim()
    }
  }

  return null
}
