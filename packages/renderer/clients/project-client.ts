import {
  JSON_HEADERS,
  rendererApiRequest as apiFetch,
} from '@renderer/clients/http-client'
import {
  novelPromotionRoutes,
  projectRoutes,
  withQuery,
} from '@shared/contracts/renderer-api-routes'

export function listProjects(params: URLSearchParams) {
  return apiFetch(withQuery(projectRoutes.root, params))
}

export function createProject(payload: Record<string, unknown>) {
  return apiFetch(projectRoutes.root, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}

export function updateProject(projectId: string, payload: Record<string, unknown>) {
  return apiFetch(projectRoutes.detail(projectId), {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}

export function deleteProject(projectId: string) {
  return apiFetch(projectRoutes.detail(projectId), {
    method: 'DELETE',
  })
}

export function getProjectData(projectId: string) {
  return apiFetch(projectRoutes.data(projectId))
}

export function getNovelPromotionEpisode(projectId: string, episodeId: string) {
  return apiFetch(novelPromotionRoutes.episode(projectId, episodeId))
}

export function getProjectAssets(projectId: string) {
  return apiFetch(novelPromotionRoutes.assets(projectId))
}

export function getProjectCharacters(projectId: string) {
  return apiFetch(novelPromotionRoutes.characters(projectId))
}

export function getProjectLocations(projectId: string) {
  return apiFetch(novelPromotionRoutes.locations(projectId))
}

export function getUserModels() {
  return apiFetch(projectRoutes.userModels)
}

export function listNovelPromotionEpisodes(projectId: string) {
  return apiFetch(novelPromotionRoutes.episodes(projectId))
}

export function createNovelPromotionEpisode(
  projectId: string,
  payload: { name: string; description?: string },
) {
  return apiFetch(novelPromotionRoutes.episodes(projectId), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}

export function updateNovelPromotionEpisode(
  projectId: string,
  episodeId: string,
  payload: Record<string, unknown>,
) {
  return apiFetch(novelPromotionRoutes.episode(projectId, episodeId), {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}

export function deleteNovelPromotionEpisode(projectId: string, episodeId: string) {
  return apiFetch(novelPromotionRoutes.episode(projectId, episodeId), {
    method: 'DELETE',
  })
}

export function getUserPreference() {
  return apiFetch(projectRoutes.userPreference)
}

export function updateUserPreference(payload: Record<string, unknown>) {
  return apiFetch(projectRoutes.userPreference, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}
