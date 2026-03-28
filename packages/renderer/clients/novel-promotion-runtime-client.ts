import { resolveTaskErrorMessage } from '@/lib/task/error-message'
import { resolveTaskResponse } from '@/lib/task/client'
import {
  JSON_HEADERS,
  rendererApiRequest as apiFetch,
} from '@renderer/clients/http-client'
import { novelPromotionRoutes, withQuery } from '@shared/contracts/renderer-api-routes'
import type {
  SpeakerVoiceEntry,
  SpeakerVoicePatch,
} from '@/lib/voice/provider-voice-binding'

type RendererClientError = Error & {
  status?: number
  payload?: Record<string, unknown>
  detail?: string
}

export interface RendererStoryboardStats {
  storyboardCount: number
  panelCount: number
}

export interface RendererProjectEpisodeRecord {
  episodeNumber?: number
  name?: string
  description?: string
  novelText?: string
}

export interface RendererProjectEpisodesResponse {
  episodes?: RendererProjectEpisodeRecord[]
}

export interface RendererProjectEpisodesBatchPayload {
  episodes: Array<{
    name: string
    description?: string
    novelText?: string
  }>
  clearExisting?: boolean
  importStatus?: 'pending' | 'completed'
  triggerGlobalAnalysis?: boolean
}

export interface RendererSplitEpisodeRecord {
  number: number
  title: string
  summary: string
  content: string
  wordCount: number
}

export interface RendererSplitEpisodesResponse {
  episodes?: RendererSplitEpisodeRecord[]
}

export interface RendererProjectVoiceLine {
  id: string
  lineIndex: number
  speaker: string
  content: string
  emotionPrompt: string | null
  emotionStrength: number | null
  audioUrl: string | null
  updatedAt: string | null
  lineTaskRunning: boolean
  matchedPanelId?: string | null
  matchedStoryboardId?: string | null
  matchedPanelIndex?: number | null
}

export interface RendererVoiceStageDataResponse {
  voiceLines: RendererProjectVoiceLine[]
  speakerVoices: Record<string, SpeakerVoiceEntry>
  speakers: string[]
}

export interface RendererMatchedVoiceLine {
  id: string
  lineIndex: number
  speaker: string
  content: string
  audioUrl: string | null
  audioDuration?: number | null
  matchedStoryboardId: string | null
  matchedPanelIndex: number | null
}

export interface RendererMatchedVoiceLinesData {
  voiceLines: RendererMatchedVoiceLine[]
}

export interface RendererGenerateProjectVoiceResponse {
  success?: boolean
  async?: boolean
  taskId?: string
  taskIds?: string[]
  total?: number
  error?: string
  results?: Array<{ lineId?: string; taskId?: string; audioUrl?: string }>
}

export interface RendererDesignProjectVoiceResponse {
  success?: boolean
  voiceId?: string
  targetModel?: string
  audioBase64?: string
  requestId?: string
}

export interface RendererModifyShotPromptResponse {
  modifiedImagePrompt: string
  modifiedVideoPrompt?: string
  referencedAssets?: Array<{
    id: string
    name: string
    description: string
    type: 'character' | 'location'
  }>
}

export interface RendererEpisodeVideoUrlsResponse {
  videos?: Array<{ index: number; fileName: string; videoUrl: string }>
  projectName?: string
}

type RendererUploadProjectCharacterImagePayload = {
  file: File
  characterId: string
  appearanceId: string
  imageIndex?: number
  labelText?: string
}

type RendererUploadProjectLocationImagePayload = {
  file: File
  locationId: string
  imageIndex?: number
  labelText?: string
}

async function parseJsonSafe(response: Response): Promise<Record<string, unknown>> {
  const data = await response.json().catch(() => ({}))
  if (data && typeof data === 'object') {
    return data as Record<string, unknown>
  }
  return {}
}

function createRequestError(
  status: number,
  payload: Record<string, unknown>,
  fallbackMessage: string,
): RendererClientError {
  const error = new Error(resolveTaskErrorMessage(payload, fallbackMessage)) as RendererClientError
  error.status = status
  error.payload = payload
  if (typeof payload.detail === 'string') {
    error.detail = payload.detail
  }
  return error
}

async function requestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  const response = await apiFetch(input, init)
  const data = await parseJsonSafe(response)
  if (!response.ok) {
    throw createRequestError(response.status, data, fallbackMessage)
  }
  return data as T
}

async function requestResolvedTask<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  const response = await apiFetch(input, init)
  if (!response.ok) {
    const data = await parseJsonSafe(response)
    throw createRequestError(response.status, data, fallbackMessage)
  }
  return resolveTaskResponse<T>(response)
}

async function requestVoid(
  input: RequestInfo | URL,
  init: RequestInit,
  fallbackMessage: string,
): Promise<void> {
  const response = await apiFetch(input, init)
  if (response.ok) return
  const data = await parseJsonSafe(response)
  throw createRequestError(response.status, data, fallbackMessage)
}

async function requestBlob(
  input: RequestInfo | URL,
  init: RequestInit,
  fallbackMessage: string,
): Promise<Blob> {
  const response = await apiFetch(input, init)
  if (response.ok) {
    return response.blob()
  }
  const data = await parseJsonSafe(response)
  throw createRequestError(response.status, data, fallbackMessage)
}

function buildProjectAssetImageUploadFormData(
  payload:
    | ({ type: 'character' } & RendererUploadProjectCharacterImagePayload)
    | ({ type: 'location' } & RendererUploadProjectLocationImagePayload),
) {
  const formData = new FormData()
  formData.append('file', payload.file)
  formData.append('type', payload.type)
  if (payload.type === 'character') {
    formData.append('id', payload.characterId)
    formData.append('appearanceId', payload.appearanceId)
  } else {
    formData.append('id', payload.locationId)
  }
  if (typeof payload.imageIndex === 'number') {
    formData.append('imageIndex', payload.imageIndex.toString())
  }
  if (payload.labelText) {
    formData.append('labelText', payload.labelText)
  }
  return formData
}

export async function requestGetProjectStoryboardStats(
  projectId: string,
  episodeId: string,
): Promise<RendererStoryboardStats> {
  const data = await requestJson<{ storyboards?: Array<{ panels?: unknown[] }> }>(
    withQuery(novelPromotionRoutes.storyboards(projectId), { episodeId }),
    { method: 'GET' },
    'storyboards check failed',
  )
  const storyboards = Array.isArray(data.storyboards) ? data.storyboards : []
  const storyboardCount = storyboards.length
  const panelCount = storyboards.reduce((sum, storyboard) => {
    const panels = Array.isArray(storyboard?.panels) ? storyboard.panels.length : 0
    return sum + panels
  }, 0)
  return { storyboardCount, panelCount }
}

export function requestUpdateProjectConfig(
  projectId: string,
  key: string,
  value: unknown,
) {
  return requestJson(
    novelPromotionRoutes.project(projectId),
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify({ [key]: value }),
    },
    'Failed to update config',
  )
}

export function requestUpdateProjectEpisodeField(
  projectId: string,
  episodeId: string,
  key: string,
  value: unknown,
) {
  return requestJson(
    novelPromotionRoutes.episode(projectId, episodeId),
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify({ [key]: value }),
    },
    'Failed to update episode',
  )
}

export function requestListProjectEpisodes(projectId: string) {
  return requestJson<RendererProjectEpisodesResponse>(
    novelPromotionRoutes.episodes(projectId),
    { method: 'GET' },
    '获取剧集失败',
  )
}

export function requestSaveProjectEpisodesBatch(
  projectId: string,
  payload: RendererProjectEpisodesBatchPayload,
) {
  return requestJson(
    novelPromotionRoutes.episodesBatch(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '保存剧集失败',
  )
}

export function requestSplitProjectEpisodes(
  projectId: string,
  payload: { content: string; async?: boolean },
) {
  return requestResolvedTask<RendererSplitEpisodesResponse>(
    novelPromotionRoutes.splitEpisodes(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '分割失败',
  )
}

export function requestSplitProjectEpisodesByMarkers(
  projectId: string,
  payload: { content: string },
) {
  return requestJson<RendererSplitEpisodesResponse>(
    novelPromotionRoutes.splitEpisodesByMarkers(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '分割失败',
  )
}

export function requestAnalyzeProjectAssets(projectId: string, episodeId: string) {
  return requestResolvedTask(
    novelPromotionRoutes.analyze(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ episodeId, async: true }),
    },
    'Failed to analyze assets',
  )
}

export function requestAnalyzeProjectShotVariants(
  projectId: string,
  payload: { panelId: string },
) {
  return requestResolvedTask<{
    success: boolean
    suggestions: Array<{
      id: number
      title: string
      description: string
      shot_type: string
      camera_move: string
      video_prompt: string
      creative_score: number
    }>
    panelInfo?: {
      panelNumber?: string | number | null
      imageUrl?: string | null
      description?: string | null
    }
  }>(
    novelPromotionRoutes.analyzeShotVariants(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '分析失败',
  )
}

export function requestAnalyzeProjectGlobalAssets(projectId: string) {
  return requestResolvedTask<{ stats?: { newCharacters?: number; newLocations?: number } }>(
    novelPromotionRoutes.analyzeGlobal(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ async: true }),
    },
    'Failed to analyze global assets',
  )
}

export function requestCopyProjectAssetFromGlobal(
  projectId: string,
  payload: {
    type: 'character' | 'location' | 'voice'
    targetId: string
    globalAssetId: string
  },
) {
  return requestJson(
    novelPromotionRoutes.copyFromGlobal(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'Failed to copy from global',
  )
}

export function requestGenerateProjectCharacterImage(
  projectId: string,
  payload: {
    characterId: string
    appearanceId: string
    count?: number
  },
) {
  return requestJson(
    novelPromotionRoutes.generateImage(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        type: 'character',
        id: payload.characterId,
        appearanceId: payload.appearanceId,
        count: payload.count,
      }),
    },
    'Failed to generate image',
  )
}

export function requestGenerateProjectLocationImage(
  projectId: string,
  payload: {
    locationId: string
    imageIndex?: number
    artStyle?: string
    count?: number
  },
) {
  return requestJson(
    novelPromotionRoutes.generateImage(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        type: 'location',
        id: payload.locationId,
        imageIndex: payload.imageIndex,
        artStyle: payload.artStyle,
        count: payload.count,
      }),
    },
    'Failed to generate image',
  )
}

export function requestUploadProjectCharacterImage(
  projectId: string,
  payload: RendererUploadProjectCharacterImagePayload,
) {
  return requestJson(
    novelPromotionRoutes.uploadAssetImage(projectId),
    {
      method: 'POST',
      body: buildProjectAssetImageUploadFormData({
        type: 'character',
        ...payload,
      }),
    },
    'Failed to upload image',
  )
}

export function requestUploadProjectLocationImage(
  projectId: string,
  payload: RendererUploadProjectLocationImagePayload,
) {
  return requestJson(
    novelPromotionRoutes.uploadAssetImage(projectId),
    {
      method: 'POST',
      body: buildProjectAssetImageUploadFormData({
        type: 'location',
        ...payload,
      }),
    },
    'Failed to upload image',
  )
}

export function requestDeleteProjectCharacter(projectId: string, characterId: string) {
  return requestVoid(
    withQuery(novelPromotionRoutes.character(projectId), { id: characterId }),
    { method: 'DELETE' },
    'Failed to delete character',
  )
}

export function requestDeleteProjectAppearance(
  projectId: string,
  payload: {
    characterId: string
    appearanceId: string
  },
) {
  return requestVoid(
    withQuery(novelPromotionRoutes.characterAppearance(projectId), {
      characterId: payload.characterId,
      appearanceId: payload.appearanceId,
    }),
    { method: 'DELETE' },
    'Failed to delete appearance',
  )
}

export function requestDeleteProjectLocation(projectId: string, locationId: string) {
  return requestVoid(
    withQuery(novelPromotionRoutes.location(projectId), { id: locationId }),
    { method: 'DELETE' },
    'Failed to delete location',
  )
}

export function requestBatchConfirmProjectCharacterProfiles(projectId: string) {
  return requestResolvedTask<{
    success?: boolean
    count?: number
    message?: string
  }>(
    novelPromotionRoutes.characterProfileBatchConfirm(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
    },
    '批量确认失败',
  )
}

export function requestModifyProjectCharacterImage(
  projectId: string,
  payload: {
    characterId: string
    appearanceId: string
    imageIndex: number
    modifyPrompt: string
    extraImageUrls?: string[]
  },
) {
  return requestJson(
    novelPromotionRoutes.modifyAssetImage(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        type: 'character',
        ...payload,
      }),
    },
    'Failed to modify image',
  )
}

export function requestUpdateProjectAppearanceDescription(
  projectId: string,
  payload: {
    characterId: string
    appearanceId: string
    description: string
    descriptionIndex?: number
  },
) {
  return requestJson(
    novelPromotionRoutes.characterAppearance(projectId),
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        characterId: payload.characterId,
        appearanceId: payload.appearanceId,
        description: payload.description,
        descriptionIndex:
          typeof payload.descriptionIndex === 'number' ? payload.descriptionIndex : 0,
      }),
    },
    'Failed to update appearance description',
  )
}

export function requestModifyProjectLocationImage(
  projectId: string,
  payload: {
    locationId: string
    imageIndex: number
    modifyPrompt: string
    extraImageUrls?: string[]
  },
) {
  return requestJson(
    novelPromotionRoutes.modifyAssetImage(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        type: 'location',
        ...payload,
      }),
    },
    'Failed to modify image',
  )
}

export function requestRegenerateProjectCharacterGroup(
  projectId: string,
  payload: { characterId: string; appearanceId: string; count?: number },
) {
  return requestJson(
    novelPromotionRoutes.regenerateGroup(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        type: 'character',
        id: payload.characterId,
        appearanceId: payload.appearanceId,
        count: payload.count,
      }),
    },
    'Failed to regenerate group',
  )
}

export function requestRegenerateProjectLocationGroup(
  projectId: string,
  payload: { locationId: string; count?: number },
) {
  return requestJson(
    novelPromotionRoutes.regenerateGroup(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        type: 'location',
        id: payload.locationId,
        count: payload.count,
      }),
    },
    'Failed to regenerate group',
  )
}

export function requestRegenerateSingleProjectCharacterImage(
  projectId: string,
  payload: { characterId: string; appearanceId: string; imageIndex: number },
) {
  return requestJson(
    novelPromotionRoutes.regenerateSingleImage(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        type: 'character',
        id: payload.characterId,
        appearanceId: payload.appearanceId,
        imageIndex: payload.imageIndex,
      }),
    },
    'Failed to regenerate image',
  )
}

export function requestRegenerateSingleProjectLocationImage(
  projectId: string,
  payload: { locationId: string; imageIndex: number },
) {
  return requestJson(
    novelPromotionRoutes.regenerateSingleImage(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        type: 'location',
        id: payload.locationId,
        imageIndex: payload.imageIndex,
      }),
    },
    'Failed to regenerate image',
  )
}

export function requestUpdateProjectLocationDescription(
  projectId: string,
  payload: {
    locationId: string
    description: string
    imageIndex?: number
  },
) {
  return requestJson(
    novelPromotionRoutes.location(projectId),
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        locationId: payload.locationId,
        description: payload.description,
        imageIndex: typeof payload.imageIndex === 'number' ? payload.imageIndex : 0,
      }),
    },
    'Failed to update location description',
  )
}

export function requestAiCreateProjectLocation(
  projectId: string,
  payload: { userInstruction: string },
) {
  return requestResolvedTask<{ prompt?: string }>(
    novelPromotionRoutes.aiCreateLocation(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'Failed to design location',
  )
}

export function requestCreateProjectStoryboardGroup(
  projectId: string,
  payload: { episodeId: string; insertIndex: number },
) {
  return requestJson(
    novelPromotionRoutes.storyboardGroup(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '添加失败',
  )
}

export function requestMoveProjectStoryboardGroup(
  projectId: string,
  payload: { episodeId: string; clipId: string; direction: 'up' | 'down' },
) {
  return requestJson(
    novelPromotionRoutes.storyboardGroup(projectId),
    {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '移动失败',
  )
}

export function requestDeleteProjectStoryboardGroup(
  projectId: string,
  payload: { storyboardId: string },
) {
  return requestJson(
    withQuery(novelPromotionRoutes.storyboardGroup(projectId), {
      storyboardId: payload.storyboardId,
    }),
    { method: 'DELETE' },
    '删除失败',
  )
}

export function requestCreateProjectPanel(projectId: string, payload: Record<string, unknown>) {
  return requestJson(
    novelPromotionRoutes.panel(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '添加失败',
  )
}

export function requestDeleteProjectPanel(
  projectId: string,
  payload: { panelId: string },
) {
  return requestJson(
    withQuery(novelPromotionRoutes.panel(projectId), { panelId: payload.panelId }),
    { method: 'DELETE' },
    '删除失败',
  )
}

export function requestUpdateProjectPanel(projectId: string, payload: Record<string, unknown>) {
  return requestJson(
    novelPromotionRoutes.panel(projectId),
    {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '保存失败',
  )
}

export function requestInsertProjectPanel(
  projectId: string,
  payload: { storyboardId: string; insertAfterPanelId: string; userInput: string },
) {
  return requestJson(
    novelPromotionRoutes.insertPanel(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '插入分镜失败',
  )
}

export function requestCreateProjectPanelVariant(
  projectId: string,
  payload: {
    storyboardId: string
    insertAfterPanelId: string
    sourcePanelId: string
    variant: {
      title: string
      description: string
      shot_type: string
      camera_move: string
      video_prompt: string
    }
    includeCharacterAssets: boolean
    includeLocationAsset: boolean
  },
) {
  return requestJson<{ panelId: string }>(
    novelPromotionRoutes.panelVariant(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '生成变体失败',
  )
}

export function requestClearProjectStoryboardError(
  projectId: string,
  payload: { storyboardId: string },
) {
  return requestJson(
    novelPromotionRoutes.storyboards(projectId),
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '清除分镜错误失败',
  )
}

export function requestDownloadProjectImages(projectId: string, payload: { episodeId: string }) {
  return requestBlob(
    withQuery(novelPromotionRoutes.downloadImages(projectId), {
      episodeId: payload.episodeId,
    }),
    { method: 'GET' },
    '下载失败',
  )
}

export async function requestRegenerateProjectPanelImage(
  projectId: string,
  payload: { panelId: string; count?: number },
) {
  const response = await apiFetch(novelPromotionRoutes.regeneratePanelImage(projectId), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      panelId: payload.panelId,
      count: payload.count ?? 1,
    }),
  })
  if (response.ok) {
    return response.json()
  }

  const errorPayload = await parseJsonSafe(response)
  if (response.status === 402) {
    throw new Error('余额不足，请充值后继续使用')
  }
  if (response.status === 400 && String(errorPayload.error || '').includes('敏感')) {
    throw createRequestError(response.status, errorPayload, '提示词包含敏感内容')
  }
  if (response.status === 429 || errorPayload.code === 'RATE_LIMIT') {
    const retryAfter = errorPayload.retryAfter || 60
    throw new Error(`API 配额超限，请等待 ${retryAfter} 秒后重试`)
  }
  throw createRequestError(response.status, errorPayload, '重新生成失败')
}

export function requestModifyProjectStoryboardImage(
  projectId: string,
  payload: {
    storyboardId: string
    panelIndex: number
    modifyPrompt: string
    extraImageUrls: string[]
    selectedAssets: Array<{
      id: string
      name: string
      type: 'character' | 'location'
      imageUrl: string | null
      appearanceId?: number
      appearanceName?: string
    }>
  },
) {
  return requestJson(
    novelPromotionRoutes.modifyStoryboardImage(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '修改失败',
  )
}

export function requestRegenerateProjectStoryboardText(
  projectId: string,
  payload: { storyboardId: string },
) {
  return requestResolvedTask(
    novelPromotionRoutes.regenerateStoryboardText(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        storyboardId: payload.storyboardId,
        async: true,
      }),
    },
    'regenerate storyboard text failed',
  )
}

export function requestCreateProjectLocation(
  projectId: string,
  payload: {
    name: string
    description: string
    artStyle?: string
    count?: number
  },
) {
  return requestJson(
    novelPromotionRoutes.location(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'Failed to create location',
  )
}

export function requestConfirmProjectCharacterSelection(
  projectId: string,
  payload: { characterId: string; appearanceId: string },
) {
  return requestJson(
    novelPromotionRoutes.characterConfirmSelection(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '确认选择失败',
  )
}

export function requestConfirmProjectCharacterProfile(
  projectId: string,
  payload: {
    characterId: string
    profileData?: unknown
    generateImage?: boolean
  },
) {
  return requestResolvedTask<{
    success?: boolean
    character?: {
      id?: string
      profileConfirmed?: boolean
      appearances?: Array<{
        id?: number
        descriptions?: string[]
      }>
    }
  }>(
    novelPromotionRoutes.characterProfileConfirm(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '确认失败',
  )
}

export function requestConfirmProjectLocationSelection(
  projectId: string,
  payload: { locationId: string },
) {
  return requestJson(
    novelPromotionRoutes.locationConfirmSelection(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '确认选择失败',
  )
}

export function requestSelectProjectCharacterImage(
  projectId: string,
  payload: {
    characterId: string
    appearanceId: string
    selectedIndex: number | null
  },
) {
  return requestJson(
    novelPromotionRoutes.selectCharacterImage(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'Failed to select image',
  )
}

export function requestSelectProjectLocationImage(
  projectId: string,
  payload: {
    locationId: string
    selectedIndex: number | null
  },
) {
  return requestJson(
    novelPromotionRoutes.selectLocationImage(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'Failed to select image',
  )
}

export function requestUndoProjectCharacterImage(
  projectId: string,
  payload: {
    characterId: string
    appearanceId: string
  },
) {
  return requestJson(
    novelPromotionRoutes.undoRegenerate(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        type: 'character',
        id: payload.characterId,
        appearanceId: payload.appearanceId,
      }),
    },
    'Failed to undo image',
  )
}

export function requestUndoProjectLocationImage(projectId: string, locationId: string) {
  return requestJson(
    novelPromotionRoutes.undoRegenerate(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        type: 'location',
        id: locationId,
      }),
    },
    'Failed to undo image',
  )
}

export function requestStoryToScriptRun(
  projectId: string,
  payload: Record<string, unknown>,
  signal?: AbortSignal,
) {
  return apiFetch(novelPromotionRoutes.storyToScriptStream(projectId), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
    signal,
  })
}

export function requestScriptToStoryboardRun(
  projectId: string,
  payload: Record<string, unknown>,
  signal?: AbortSignal,
) {
  return apiFetch(novelPromotionRoutes.scriptToStoryboardStream(projectId), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
    signal,
  })
}

export function requestMatchedVoiceLines(
  projectId: string,
  episodeId: string,
) {
  return requestJson<RendererMatchedVoiceLinesData>(
    withQuery(novelPromotionRoutes.voiceLines(projectId), { episodeId }),
    { method: 'GET' },
    'Failed to fetch matched voice lines',
  )
}

export async function requestFetchProjectVoiceStageData(
  projectId: string,
  episodeId: string,
): Promise<RendererVoiceStageDataResponse> {
  const [linesData, voicesData, speakersData] = await Promise.all([
    requestJson<{ voiceLines?: RendererProjectVoiceLine[] }>(
      withQuery(novelPromotionRoutes.voiceLines(projectId), { episodeId }),
      { method: 'GET' },
      '获取台词失败',
    ),
    requestJson<{ speakerVoices?: Record<string, SpeakerVoiceEntry> }>(
      withQuery(novelPromotionRoutes.speakerVoice(projectId), { episodeId }),
      { method: 'GET' },
      '获取角色音色失败',
    ),
    requestJson<{ speakers?: string[] }>(
      withQuery(novelPromotionRoutes.voiceLines(projectId), { speakersOnly: 1 }),
      { method: 'GET' },
      '获取说话人失败',
    ),
  ])

  return {
    voiceLines: Array.isArray(linesData.voiceLines) ? linesData.voiceLines : [],
    speakerVoices: voicesData.speakerVoices || {},
    speakers: Array.isArray(speakersData.speakers) ? speakersData.speakers : [],
  }
}

export function requestAnalyzeProjectVoice(projectId: string, episodeId: string) {
  return requestResolvedTask(
    novelPromotionRoutes.voiceAnalyze(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ episodeId, async: true }),
    },
    'voice analyze failed',
  )
}

export function requestDesignProjectVoice(
  projectId: string,
  payload: {
    voicePrompt: string
    previewText: string
    preferredName: string
    language: 'zh'
  },
) {
  return requestResolvedTask<RendererDesignProjectVoiceResponse>(
    novelPromotionRoutes.voiceDesign(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'Failed to design voice',
  )
}

export function requestAiModifyProjectShotPrompt(
  projectId: string,
  payload: {
    currentPrompt: string
    currentVideoPrompt?: string
    modifyInstruction: string
    referencedAssets: Array<{
      id: string
      name: string
      description: string
      type: 'character' | 'location'
    }>
  },
) {
  return requestResolvedTask<RendererModifyShotPromptResponse>(
    novelPromotionRoutes.aiModifyShotPrompt(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'Failed to modify shot prompt',
  )
}

export function requestGenerateProjectVoice(
  projectId: string,
  payload: { episodeId: string; lineId?: string; all?: boolean },
) {
  return requestJson<RendererGenerateProjectVoiceResponse>(
    novelPromotionRoutes.voiceGenerate(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(
        payload.all ? { episodeId: payload.episodeId, all: true } : { episodeId: payload.episodeId, lineId: payload.lineId },
      ),
    },
    'voice generate failed',
  )
}

export function requestCreateProjectVoiceLine(
  projectId: string,
  payload: {
    episodeId: string
    content: string
    speaker: string
    matchedPanelId?: string | null
  },
) {
  return requestJson<{ voiceLine: RendererProjectVoiceLine }>(
    novelPromotionRoutes.voiceLines(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'add failed',
  )
}

export function requestUpdateProjectVoiceLine(
  projectId: string,
  payload: Record<string, unknown>,
) {
  return requestJson<{ voiceLine: RendererProjectVoiceLine }>(
    novelPromotionRoutes.voiceLines(projectId),
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'update failed',
  )
}

export async function requestDeleteProjectVoiceLine(
  projectId: string,
  lineId: string,
): Promise<null> {
  await requestVoid(
    withQuery(novelPromotionRoutes.voiceLines(projectId), { lineId }),
    { method: 'DELETE' },
    'delete failed',
  )
  return null
}

export function requestDownloadProjectVoices(projectId: string, episodeId: string) {
  return requestBlob(
    withQuery(novelPromotionRoutes.downloadVoices(projectId), { episodeId }),
    { method: 'GET' },
    'download failed',
  )
}

export function requestUpdateSpeakerVoice(
  projectId: string,
  payload: { episodeId: string; speaker: string } & SpeakerVoicePatch,
) {
  return requestJson<{ success: boolean }>(
    novelPromotionRoutes.speakerVoice(projectId),
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'update speaker voice failed',
  )
}

export function requestUploadProjectCharacterVoice(
  projectId: string,
  payload: { file: File; characterId: string },
) {
  const formData = new FormData()
  formData.append('file', payload.file)
  formData.append('characterId', payload.characterId)

  return requestJson(
    novelPromotionRoutes.characterVoice(projectId),
    {
      method: 'POST',
      body: formData,
    },
    'Failed to upload voice',
  )
}

export function requestUpdateProjectCharacterVoiceSettings(
  projectId: string,
  payload: {
    characterId: string
    voiceType: 'qwen-designed' | 'uploaded' | 'custom' | null
    voiceId?: string
    customVoiceUrl?: string
  },
) {
  return requestJson(
    novelPromotionRoutes.characterVoice(projectId),
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '更新音色失败',
  )
}

export function requestSaveProjectDesignedVoice(
  projectId: string,
  payload: {
    characterId: string
    voiceId: string
    audioBase64: string
  },
) {
  return requestJson<{ audioUrl?: string }>(
    novelPromotionRoutes.characterVoice(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        characterId: payload.characterId,
        voiceDesign: {
          voiceId: payload.voiceId,
          audioBase64: payload.audioBase64,
        },
      }),
    },
    '保存失败',
  )
}

export function requestListProjectEpisodeVideoUrls(
  projectId: string,
  payload: {
    episodeId: string
    panelPreferences: Record<string, boolean>
  },
) {
  return requestJson<RendererEpisodeVideoUrlsResponse>(
    novelPromotionRoutes.videoUrls(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '获取视频列表失败',
  )
}

export function requestDownloadRemoteBlob(url: string) {
  return requestBlob(url, { method: 'GET' }, '下载失败')
}

export function requestGenerateVideo(
  projectId: string,
  payload: {
    storyboardId: string
    panelIndex: number
    videoModel: string
    generationOptions?: Record<string, string | number | boolean>
    firstLastFrame?: {
      lastFrameStoryboardId: string
      lastFramePanelIndex: number
      flModel: string
      customPrompt?: string
    }
  },
) {
  return requestJson(
    novelPromotionRoutes.generateVideo(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '视频生成失败',
  )
}

export function requestBatchGenerateVideos(
  projectId: string,
  payload: {
    all: boolean
    episodeId: string
    videoModel: string
    generationOptions?: Record<string, string | number | boolean>
  },
) {
  return requestJson(
    novelPromotionRoutes.generateVideo(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '批量视频生成失败',
  )
}

export function requestLipSync(
  projectId: string,
  payload: {
    storyboardId: string
    panelIndex: number
    voiceLineId: string
  },
) {
  return requestJson(
    novelPromotionRoutes.lipSync(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'Lip sync failed',
  )
}

export function requestUpdateProjectClip(
  projectId: string,
  clipId: string,
  data: Record<string, unknown>,
) {
  return requestJson(
    novelPromotionRoutes.clips(projectId, clipId),
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    },
    'update failed',
  )
}

export function requestUpdateProjectPanelLink(
  projectId: string,
  payload: {
    storyboardId: string
    panelIndex: number
    linked: boolean
  },
) {
  return requestJson(
    novelPromotionRoutes.panelLink(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '保存链接状态失败',
  )
}

export function requestUpdateProjectPanelVideoPrompt(
  projectId: string,
  payload: {
    storyboardId: string
    panelIndex: number
    value: string
    field?: 'videoPrompt' | 'firstLastFramePrompt'
  },
) {
  const { storyboardId, panelIndex, value, field = 'videoPrompt' } = payload
  return requestJson(
    novelPromotionRoutes.panel(projectId),
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        storyboardId,
        panelIndex,
        ...(field === 'firstLastFramePrompt'
          ? { firstLastFramePrompt: value }
          : { videoPrompt: value }),
      }),
    },
    'update failed',
  )
}

export function requestUpdateProjectPhotographyPlan(
  projectId: string,
  payload: {
    storyboardId: string
    photographyPlan: string
  },
) {
  return requestJson(
    novelPromotionRoutes.photographyPlan(projectId),
    {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '保存摄影规则失败',
  )
}

export function requestUpdateProjectPanelActingNotes(
  projectId: string,
  payload: {
    storyboardId: string
    panelIndex: number
    actingNotes: string
  },
) {
  return requestJson(
    novelPromotionRoutes.panel(projectId),
    {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '保存演技指导失败',
  )
}

export function requestSelectProjectPanelCandidate(
  projectId: string,
  payload: {
    panelId: string
    action: 'select' | 'cancel'
    selectedImageUrl?: string
  },
) {
  return requestJson(
    novelPromotionRoutes.panelSelectCandidate(projectId),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'Failed to select panel candidate',
  )
}
