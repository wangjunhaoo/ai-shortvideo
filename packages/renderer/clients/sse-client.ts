import { sseRoutes } from '@shared/contracts/renderer-api-routes'

export function buildProjectSseUrl(projectId: string, episodeId?: string | null) {
  return sseRoutes.project(projectId, episodeId)
}
