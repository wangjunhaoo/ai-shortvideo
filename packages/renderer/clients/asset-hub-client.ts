import { resolveTaskErrorMessage } from '@/lib/task/error-message'
import { resolveTaskResponse } from '@/lib/task/client'
import {
  JSON_HEADERS,
  rendererApiRequest as apiFetch,
} from '@renderer/clients/http-client'
import { assetHubRoutes, withQuery } from '@shared/contracts/renderer-api-routes'

type AssetHubClientError = Error & {
  status?: number
  payload?: Record<string, unknown>
  detail?: string
}

async function parseJsonSafe(response: Response) {
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
): AssetHubClientError {
  const error = new Error(resolveTaskErrorMessage(payload, fallbackMessage)) as AssetHubClientError
  error.status = status
  error.payload = payload
  if (typeof payload.detail === 'string') {
    error.detail = payload.detail
  }
  return error
}

async function requestJson<T = Record<string, unknown>>(
  input: RequestInfo | URL,
  init: RequestInit,
  fallbackMessage: string,
) {
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
) {
  const response = await apiFetch(input, init)
  if (!response.ok) {
    const data = await parseJsonSafe(response)
    throw createRequestError(response.status, data, fallbackMessage)
  }
  return resolveTaskResponse<T>(response)
}

async function requestVoid(input: RequestInfo | URL, init: RequestInit, fallbackMessage: string) {
  const response = await apiFetch(input, init)
  if (response.ok) return
  const data = await parseJsonSafe(response)
  throw createRequestError(response.status, data, fallbackMessage)
}

function buildAssetHubUploadImageFormData(
  payload:
    | {
        type: 'character'
        file: File
        id: string
        appearanceIndex: number
        labelText?: string
        imageIndex?: number
      }
    | {
        type: 'location'
        file: File
        id: string
        labelText?: string
        imageIndex?: number
      },
) {
  const formData = new FormData()
  formData.append('file', payload.file)
  formData.append('type', payload.type)
  formData.append('id', payload.id)
  if (payload.type === 'character') {
    formData.append('appearanceIndex', payload.appearanceIndex.toString())
  }
  if (payload.labelText) {
    formData.append('labelText', payload.labelText)
  }
  if (typeof payload.imageIndex === 'number') {
    formData.append('imageIndex', payload.imageIndex.toString())
  }
  return formData
}

export function listAssetHubCharacters(folderId?: string | null) {
  return apiFetch(withQuery(assetHubRoutes.characters(), { folderId }))
}

export function listAssetHubLocations(folderId?: string | null) {
  return apiFetch(withQuery(assetHubRoutes.locations(), { folderId }))
}

export function listAssetHubVoices(folderId?: string | null) {
  return apiFetch(withQuery(assetHubRoutes.voices(), { folderId }))
}

export function listAssetHubFolders() {
  return apiFetch(assetHubRoutes.folders())
}

export function createAssetHubFolder(payload: { name: string }) {
  return apiFetch(assetHubRoutes.folders(), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}

export function updateAssetHubFolder(folderId: string, payload: { name: string }) {
  return apiFetch(assetHubRoutes.folders(folderId), {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}

export function deleteAssetHubFolder(folderId: string) {
  return apiFetch(assetHubRoutes.folders(folderId), {
    method: 'DELETE',
  })
}

export function saveAssetHubCharacterVoice(payload: {
  characterId: string
  voiceId: string
  audioBase64: string
}) {
  return apiFetch(assetHubRoutes.characterVoice, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}

export function requestAssetHubGenerateImage(payload: Record<string, unknown>) {
  return apiFetch(assetHubRoutes.generateImage, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}

export function requestAssetHubModifyImage(payload: Record<string, unknown>) {
  return apiFetch(assetHubRoutes.modifyImage, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}

export function updateAssetHubCharacter(characterId: string, payload: Record<string, unknown>) {
  return apiFetch(assetHubRoutes.characters(characterId), {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}

export function updateAssetHubLocation(locationId: string, payload: Record<string, unknown>) {
  return apiFetch(assetHubRoutes.locations(locationId), {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}

export function requestAiDesignAssetHubLocation(payload: { userInstruction: string }) {
  return requestResolvedTask<{ prompt?: string }>(
    assetHubRoutes.aiDesignLocation,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'Failed to design location',
  )
}

export function requestCreateAssetHubLocation(payload: {
  name: string
  summary: string
  folderId: string | null
  artStyle: string
  count?: number
}) {
  return requestJson(
    assetHubRoutes.locations(),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '创建失败',
  )
}

export function requestUpdateAssetHubCharacterName(characterId: string, name: string) {
  return requestJson(
    assetHubRoutes.characters(characterId),
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify({ name }),
    },
    'Failed to update character name',
  )
}

export function requestUpdateAssetHubLocationName(locationId: string, name: string) {
  return requestJson(
    assetHubRoutes.locations(locationId),
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify({ name }),
    },
    'Failed to update location name',
  )
}

export function requestUpdateAssetHubAssetLabel(payload: {
  type: 'character' | 'location'
  id: string
  newName: string
}) {
  return requestVoid(
    assetHubRoutes.updateAssetLabel,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    '更新图片标签失败',
  )
}

export function requestUpdateAssetHubCharacterAppearanceDescription(payload: {
  characterId: string
  appearanceIndex: number
  description: string
}) {
  return requestJson(
    assetHubRoutes.appearances,
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'Failed to update appearance description',
  )
}

export function requestUpdateAssetHubLocationSummary(payload: {
  locationId: string
  summary: string
}) {
  return requestJson(
    assetHubRoutes.locations(payload.locationId),
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify({ summary: payload.summary }),
    },
    'Failed to update location summary',
  )
}

export function requestAiModifyAssetHubCharacterDescription(payload: {
  characterId: string
  appearanceIndex: number
  currentDescription: string
  modifyInstruction: string
}) {
  return requestResolvedTask<{ modifiedDescription?: string }>(
    assetHubRoutes.aiModifyCharacter,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'Failed to modify character description',
  )
}

export function requestAiModifyAssetHubLocationDescription(payload: {
  locationId: string
  imageIndex: number
  currentDescription: string
  modifyInstruction: string
}) {
  return requestResolvedTask<{ modifiedDescription?: string }>(
    assetHubRoutes.aiModifyLocation,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'Failed to modify location description',
  )
}

export function requestSelectAssetHubCharacterImage(payload: {
  characterId: string
  appearanceIndex: number
  imageIndex: number | null
  confirm?: boolean
}) {
  return requestJson(
    assetHubRoutes.selectImage,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        type: 'character',
        id: payload.characterId,
        appearanceIndex: payload.appearanceIndex,
        imageIndex: payload.imageIndex,
        confirm: payload.confirm ?? false,
      }),
    },
    'Failed to select image',
  )
}

export function requestSelectAssetHubLocationImage(payload: {
  locationId: string
  imageIndex: number | null
  confirm?: boolean
}) {
  return requestJson(
    assetHubRoutes.selectImage,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        type: 'location',
        id: payload.locationId,
        imageIndex: payload.imageIndex,
        confirm: payload.confirm ?? false,
      }),
    },
    'Failed to select image',
  )
}

export function requestUndoAssetHubCharacterImage(payload: {
  characterId: string
  appearanceIndex: number
}) {
  return requestJson(
    assetHubRoutes.undoImage,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        type: 'character',
        id: payload.characterId,
        appearanceIndex: payload.appearanceIndex,
      }),
    },
    'Failed to undo image',
  )
}

export function requestUndoAssetHubLocationImage(locationId: string) {
  return requestJson(
    assetHubRoutes.undoImage,
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

export function requestUploadAssetHubCharacterImage(payload: {
  file: File
  characterId: string
  appearanceIndex: number
  labelText?: string
  imageIndex?: number
}) {
  return requestJson(
    assetHubRoutes.uploadImage,
    {
      method: 'POST',
      body: buildAssetHubUploadImageFormData({
        type: 'character',
        file: payload.file,
        id: payload.characterId,
        appearanceIndex: payload.appearanceIndex,
        labelText: payload.labelText,
        imageIndex: payload.imageIndex,
      }),
    },
    'Failed to upload image',
  )
}

export function requestUploadAssetHubLocationImage(payload: {
  file: File
  locationId: string
  labelText?: string
  imageIndex?: number
}) {
  return requestJson(
    assetHubRoutes.uploadImage,
    {
      method: 'POST',
      body: buildAssetHubUploadImageFormData({
        type: 'location',
        file: payload.file,
        id: payload.locationId,
        labelText: payload.labelText,
        imageIndex: payload.imageIndex,
      }),
    },
    'Failed to upload image',
  )
}

export function deleteAssetHubCharacterAppearance(payload: {
  characterId: string
  appearanceIndex: number
}) {
  return requestVoid(
    withQuery(assetHubRoutes.appearances, {
      characterId: payload.characterId,
      appearanceIndex: payload.appearanceIndex,
    }),
    { method: 'DELETE' },
    'Failed to delete appearance',
  )
}

export function deleteAssetHubCharacter(characterId: string) {
  return requestVoid(
    assetHubRoutes.characters(characterId),
    { method: 'DELETE' },
    'Failed to delete character',
  )
}

export function deleteAssetHubLocation(locationId: string) {
  return requestVoid(
    assetHubRoutes.locations(locationId),
    { method: 'DELETE' },
    'Failed to delete location',
  )
}

export function deleteAssetHubVoice(voiceId: string) {
  return requestVoid(
    assetHubRoutes.voices(voiceId),
    { method: 'DELETE' },
    'Failed to delete voice',
  )
}

export function requestDesignAssetHubVoice(payload: {
  voicePrompt: string
  previewText: string
  preferredName: string
  language: 'zh'
}) {
  return requestResolvedTask<{
    success?: boolean
    voiceId?: string
    targetModel?: string
    audioBase64?: string
    requestId?: string
  }>(
    assetHubRoutes.voiceDesign,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    'Failed to design voice',
  )
}

export async function requestSaveDesignedAssetHubVoice(payload: {
  voiceId: string
  voiceBase64: string
  voiceName: string
  folderId: string | null
  voicePrompt: string
}) {
  const uploadData = await requestJson<{ key: string }>(
    assetHubRoutes.uploadTemp,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        base64: payload.voiceBase64,
        type: 'audio/wav',
        extension: 'wav',
      }),
    },
    '上传音频失败',
  )

  return requestJson(
    assetHubRoutes.voices(),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        name: payload.voiceName,
        description: null,
        folderId: payload.folderId,
        voiceId: payload.voiceId,
        voiceType: 'qwen-designed',
        customVoiceUrl: uploadData.key,
        voicePrompt: payload.voicePrompt,
        gender: null,
        language: 'zh',
      }),
    },
    '保存失败',
  )
}

export function requestUploadAssetHubVoice(payload: {
  uploadFile: File
  voiceName: string
  folderId: string | null
}) {
  const formData = new FormData()
  formData.append('file', payload.uploadFile)
  formData.append('name', payload.voiceName)
  if (payload.folderId) {
    formData.append('folderId', payload.folderId)
  }
  return requestJson(
    assetHubRoutes.voicesUpload,
    {
      method: 'POST',
      body: formData,
    },
    '上传失败',
  )
}

export function requestUploadAssetHubCharacterVoice(payload: {
  file: File
  characterId: string
}) {
  const formData = new FormData()
  formData.append('file', payload.file)
  formData.append('characterId', payload.characterId)

  return requestJson(
    assetHubRoutes.characterVoice,
    {
      method: 'POST',
      body: formData,
    },
    'Failed to upload voice',
  )
}
