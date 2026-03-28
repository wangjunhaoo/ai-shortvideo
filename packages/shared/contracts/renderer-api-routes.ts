export type RendererQueryPrimitive = string | number | boolean | null | undefined
export type RendererQueryValue = RendererQueryPrimitive | RendererQueryPrimitive[]
export type RendererQueryParams =
  | URLSearchParams
  | Record<string, RendererQueryValue>

const API_ROOT = '/api'

function route(path: string) {
  return `${API_ROOT}${path}`
}

function segment(value: string | number) {
  return encodeURIComponent(String(value))
}

function appendQueryValue(searchParams: URLSearchParams, key: string, value: RendererQueryPrimitive) {
  if (value === null || value === undefined) return
  searchParams.append(key, String(value))
}

export function withQuery(path: string, params?: RendererQueryParams) {
  if (!params) return path

  const searchParams =
    params instanceof URLSearchParams ? new URLSearchParams(params) : new URLSearchParams()

  if (!(params instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          appendQueryValue(searchParams, key, item)
        }
        continue
      }
      appendQueryValue(searchParams, key, value)
    }
  }

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

export const authRoutes = {
  register: route('/auth/register'),
  session: route('/auth/session'),
  csrf: route('/auth/csrf'),
  login: route('/auth/login'),
  logout: route('/auth/logout'),
}

export const projectRoutes = {
  root: route('/projects'),
  detail: (projectId: string) => route(`/projects/${segment(projectId)}`),
  data: (projectId: string) => route(`/projects/${segment(projectId)}/data`),
  userModels: route('/user/models'),
  userPreference: route('/user-preference'),
}

export const apiConfigRoutes = {
  root: route('/user/api-config'),
  testProvider: route('/user/api-config/test-provider'),
  probeModelLlmProtocol: route('/user/api-config/probe-model-llm-protocol'),
}

export const assetHubRoutes = {
  characters: (characterId?: string) =>
    characterId
      ? route(`/asset-hub/characters/${segment(characterId)}`)
      : route('/asset-hub/characters'),
  locations: (locationId?: string) =>
    locationId
      ? route(`/asset-hub/locations/${segment(locationId)}`)
      : route('/asset-hub/locations'),
  voices: (voiceId?: string) =>
    voiceId ? route(`/asset-hub/voices/${segment(voiceId)}`) : route('/asset-hub/voices'),
  folders: (folderId?: string) =>
    folderId ? route(`/asset-hub/folders/${segment(folderId)}`) : route('/asset-hub/folders'),
  characterVoice: route('/asset-hub/character-voice'),
  generateImage: route('/asset-hub/generate-image'),
  modifyImage: route('/asset-hub/modify-image'),
  aiDesignLocation: route('/asset-hub/ai-design-location'),
  aiModifyCharacter: route('/asset-hub/ai-modify-character'),
  aiModifyLocation: route('/asset-hub/ai-modify-location'),
  selectImage: route('/asset-hub/select-image'),
  undoImage: route('/asset-hub/undo-image'),
  uploadImage: route('/asset-hub/upload-image'),
  updateAssetLabel: route('/asset-hub/update-asset-label'),
  appearances: route('/asset-hub/appearances'),
  voiceDesign: route('/asset-hub/voice-design'),
  uploadTemp: route('/asset-hub/upload-temp'),
  voicesUpload: route('/asset-hub/voices/upload'),
}

export const novelPromotionRoutes = {
  project: (projectId: string) => route(`/novel-promotion/${segment(projectId)}`),
  assets: (projectId: string) => route(`/novel-promotion/${segment(projectId)}/assets`),
  characters: (projectId: string) => route(`/novel-promotion/${segment(projectId)}/characters`),
  locations: (projectId: string) => route(`/novel-promotion/${segment(projectId)}/locations`),
  episodes: (projectId: string) => route(`/novel-promotion/${segment(projectId)}/episodes`),
  episode: (projectId: string, episodeId: string) =>
    route(`/novel-promotion/${segment(projectId)}/episodes/${segment(episodeId)}`),
  episodesBatch: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/episodes/batch`),
  splitEpisodes: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/episodes/split`),
  splitEpisodesByMarkers: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/episodes/split-by-markers`),
  analyze: (projectId: string) => route(`/novel-promotion/${segment(projectId)}/analyze`),
  analyzeGlobal: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/analyze-global`),
  analyzeShotVariants: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/analyze-shot-variants`),
  copyFromGlobal: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/copy-from-global`),
  generateImage: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/generate-image`),
  uploadAssetImage: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/upload-asset-image`),
  character: (projectId: string) => route(`/novel-promotion/${segment(projectId)}/character`),
  characterAppearance: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/character/appearance`),
  characterConfirmSelection: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/character/confirm-selection`),
  characterProfileConfirm: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/character-profile/confirm`),
  characterProfileBatchConfirm: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/character-profile/batch-confirm`),
  characterVoice: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/character-voice`),
  selectCharacterImage: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/select-character-image`),
  location: (projectId: string) => route(`/novel-promotion/${segment(projectId)}/location`),
  locationConfirmSelection: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/location/confirm-selection`),
  selectLocationImage: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/select-location-image`),
  undoRegenerate: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/undo-regenerate`),
  modifyAssetImage: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/modify-asset-image`),
  regenerateGroup: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/regenerate-group`),
  regenerateSingleImage: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/regenerate-single-image`),
  aiCreateLocation: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/ai-create-location`),
  storyboardGroup: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/storyboard-group`),
  panel: (projectId: string) => route(`/novel-promotion/${segment(projectId)}/panel`),
  insertPanel: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/insert-panel`),
  panelVariant: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/panel-variant`),
  storyboards: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/storyboards`),
  downloadImages: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/download-images`),
  regeneratePanelImage: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/regenerate-panel-image`),
  modifyStoryboardImage: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/modify-storyboard-image`),
  regenerateStoryboardText: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/regenerate-storyboard-text`),
  storyToScriptStream: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/story-to-script-stream`),
  scriptToStoryboardStream: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/script-to-storyboard-stream`),
  voiceLines: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/voice-lines`),
  speakerVoice: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/speaker-voice`),
  voiceAnalyze: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/voice-analyze`),
  voiceDesign: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/voice-design`),
  aiModifyShotPrompt: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/ai-modify-shot-prompt`),
  voiceGenerate: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/voice-generate`),
  downloadVoices: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/download-voices`),
  videoUrls: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/video-urls`),
  generateVideo: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/generate-video`),
  lipSync: (projectId: string) => route(`/novel-promotion/${segment(projectId)}/lip-sync`),
  clips: (projectId: string, clipId: string) =>
    route(`/novel-promotion/${segment(projectId)}/clips/${segment(clipId)}`),
  panelLink: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/panel-link`),
  photographyPlan: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/photography-plan`),
  panelSelectCandidate: (projectId: string) =>
    route(`/novel-promotion/${segment(projectId)}/panel/select-candidate`),
}

export const runRoutes = {
  root: route('/runs'),
  detail: (runId: string) => route(`/runs/${segment(runId)}`),
  events: (runId: string) => route(`/runs/${segment(runId)}/events`),
  retryStep: (runId: string, stepId: string) =>
    route(`/runs/${segment(runId)}/steps/${segment(stepId)}/retry`),
  cancel: (runId: string) => route(`/runs/${segment(runId)}/cancel`),
}

export const taskRoutes = {
  root: route('/tasks'),
  detail: (taskId: string) => route(`/tasks/${segment(taskId)}`),
  dismiss: route('/tasks/dismiss'),
  targetStates: route('/task-target-states'),
}

export const sseRoutes = {
  root: route('/sse'),
  project: (projectId: string, episodeId?: string | null) =>
    withQuery(route('/sse'), { projectId, episodeId }),
}
