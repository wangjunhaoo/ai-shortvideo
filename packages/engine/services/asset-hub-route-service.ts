import { createHash } from 'crypto'
import { ApiError, getRequestId } from '@/lib/api-errors'
import { getUserModelConfig } from '@engine/config-service'
import { maybeSubmitLLMTask } from '@/lib/llm-observe/route-task'
import { resolveRequiredTaskLocale, resolveTaskLocale } from '@/lib/task/resolve-locale'
import { TASK_TYPE, type TaskType } from '@/lib/task/types'
import { isErrorResponse, requireUserAuth } from '@engine/api-auth'
import {
  submitAssetHubAiModifyCharacter,
  submitAssetHubAiModifyLocation,
} from '@engine/services/asset-hub-ai-modify-service'
import {
  createAssetHubCharacter,
  createAssetHubCharacterAppearance,
  deleteAssetHubCharacter,
  deleteAssetHubCharacterAppearance,
  getAssetHubCharacter,
  listAssetHubCharacters,
  updateAssetHubCharacter,
  updateAssetHubCharacterAppearance,
} from '@engine/services/asset-hub-character-service'
import { selectAssetHubImage, updateAssetHubLabel } from '@engine/services/asset-hub-image-management-service'
import {
  createAssetHubFolder,
  deleteAssetHubFolder,
  listAssetHubFolders,
  listAssetHubPickerItems,
  updateAssetHubFolder,
} from '@engine/services/asset-hub-library-service'
import {
  createAssetHubLocation,
  createAssetHubVoice,
  deleteAssetHubLocation,
  deleteAssetHubVoice,
  getAssetHubLocation,
  listAssetHubLocations,
  listAssetHubVoices,
  updateAssetHubLocation,
  updateAssetHubVoice,
  uploadAssetHubVoiceFile,
} from '@engine/services/asset-hub-location-voice-service'
import {
  submitAssetHubGenerateImageTask,
  submitAssetHubModifyImageTask,
  submitAssetHubVoiceDesignTask,
} from '@engine/services/asset-hub-task-service'

function readFolderId(request: Request) {
  return (new URL(request.url)).searchParams.get('folderId')
}

function readAssetHubPickerType(request: Request) {
  return (new URL(request.url)).searchParams.get('type')
}

async function requireAssetHubUserSession() {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  return authResult.session
}

function buildAssetHubAiDesignPayload(body: Record<string, unknown>, analysisModel: string) {
  return {
    userInstruction: body.userInstruction,
    analysisModel,
    displayMode: 'detail' as const,
  }
}

function readRequiredUserInstruction(body: Record<string, unknown>) {
  const userInstruction = typeof body.userInstruction === 'string' ? body.userInstruction.trim() : ''
  if (!userInstruction) {
    throw new ApiError('INVALID_PARAMS')
  }
  return userInstruction
}

async function handleAssetHubAiDesignRequest(input: {
  request: Request
  routePath: string
  taskType: TaskType
  targetType: string
  digestPrefix: 'character' | 'location'
}) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = (await input.request.json().catch(() => ({}))) as Record<string, unknown>
  const userInstruction = readRequiredUserInstruction(body)

  const userConfig = await getUserModelConfig(session.user.id)
  if (!userConfig.analysisModel) {
    throw new ApiError('MISSING_CONFIG')
  }

  const dedupeDigest = createHash('sha1')
    .update(`${session.user.id}:${input.digestPrefix}:${userInstruction}`)
    .digest('hex')
    .slice(0, 16)

  const asyncTaskResponse = await maybeSubmitLLMTask({
    request: input.request,
    userId: session.user.id,
    projectId: 'global-asset-hub',
    type: input.taskType,
    targetType: input.targetType,
    targetId: session.user.id,
    routePath: input.routePath,
    body: buildAssetHubAiDesignPayload(body, userConfig.analysisModel),
    dedupeKey: `asset_hub_ai_design_${input.digestPrefix}:${dedupeDigest}`,
  })
  if (asyncTaskResponse) return asyncTaskResponse

  throw new ApiError('INVALID_PARAMS')
}

export async function handleListAssetHubCharactersRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const result = await listAssetHubCharacters({
    userId: session.user.id,
    folderId: readFolderId(request),
  })
  return Response.json(result)
}

export async function handleCreateAssetHubCharacterRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = await request.json()
  const taskLocale = resolveTaskLocale(request, body)
  const result = await createAssetHubCharacter({
    userId: session.user.id,
    body,
    taskLocale,
    cookieHeader: request.headers.get('cookie'),
    acceptLanguage: request.headers.get('accept-language'),
  })
  return Response.json(result)
}

export async function handleGetAssetHubCharacterRequest(characterId: string) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const result = await getAssetHubCharacter({
    userId: session.user.id,
    characterId,
  })
  return Response.json(result)
}

export async function handleUpdateAssetHubCharacterRequest(request: Request, characterId: string) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = await request.json()
  const result = await updateAssetHubCharacter({
    userId: session.user.id,
    characterId,
    body,
  })
  return Response.json(result)
}

export async function handleDeleteAssetHubCharacterRequest(characterId: string) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const result = await deleteAssetHubCharacter({
    userId: session.user.id,
    characterId,
  })
  return Response.json(result)
}

export async function handleCreateAssetHubAppearanceRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const characterId = typeof body.characterId === 'string' ? body.characterId : ''
  if (!characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const result = await createAssetHubCharacterAppearance({
    userId: session.user.id,
    characterId,
    body,
  })
  return Response.json(result)
}

export async function handleUpdateAssetHubAppearanceRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const characterId = typeof body.characterId === 'string' ? body.characterId : ''
  const appearanceIndex =
    typeof body.appearanceIndex === 'number' || typeof body.appearanceIndex === 'string'
      ? String(body.appearanceIndex)
      : ''
  if (!characterId || !appearanceIndex) {
    throw new ApiError('INVALID_PARAMS')
  }

  const result = await updateAssetHubCharacterAppearance({
    userId: session.user.id,
    characterId,
    appearanceIndex,
    body,
  })
  return Response.json(result)
}

export async function handleDeleteAssetHubAppearanceRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const characterId = (new URL(request.url)).searchParams.get('characterId') || ''
  const appearanceIndex = (new URL(request.url)).searchParams.get('appearanceIndex') || ''
  if (!characterId || !appearanceIndex) {
    throw new ApiError('INVALID_PARAMS')
  }

  const result = await deleteAssetHubCharacterAppearance({
    userId: session.user.id,
    characterId,
    appearanceIndex,
  })
  return Response.json(result)
}

export async function handleCreateAssetHubCharacterAppearanceRequest(
  request: Request,
  characterId: string,
) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = await request.json()
  const result = await createAssetHubCharacterAppearance({
    userId: session.user.id,
    characterId,
    body,
  })
  return Response.json(result)
}

export async function handleUpdateAssetHubCharacterAppearanceRequest(
  request: Request,
  characterId: string,
  appearanceIndex: string,
) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = await request.json()
  const result = await updateAssetHubCharacterAppearance({
    userId: session.user.id,
    characterId,
    appearanceIndex,
    body,
  })
  return Response.json(result)
}

export async function handleDeleteAssetHubCharacterAppearanceRequest(
  characterId: string,
  appearanceIndex: string,
) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const result = await deleteAssetHubCharacterAppearance({
    userId: session.user.id,
    characterId,
    appearanceIndex,
  })
  return Response.json(result)
}

export async function handleListAssetHubFoldersRequest() {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const result = await listAssetHubFolders(session.user.id)
  return Response.json(result)
}

export async function handleCreateAssetHubFolderRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = await request.json()
  const result = await createAssetHubFolder({
    userId: session.user.id,
    name: body?.name,
  })
  return Response.json(result)
}

export async function handleUpdateAssetHubFolderRequest(request: Request, folderId: string) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = await request.json()
  const result = await updateAssetHubFolder({
    userId: session.user.id,
    folderId,
    name: body?.name,
  })
  return Response.json(result)
}

export async function handleDeleteAssetHubFolderRequest(folderId: string) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const result = await deleteAssetHubFolder({
    userId: session.user.id,
    folderId,
  })
  return Response.json(result)
}

export async function handleListAssetHubLocationsRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const result = await listAssetHubLocations({
    userId: session.user.id,
    folderId: readFolderId(request),
  })
  return Response.json(result)
}

export async function handleCreateAssetHubLocationRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = await request.json()
  const result = await createAssetHubLocation({
    userId: session.user.id,
    body,
  })
  return Response.json(result)
}

export async function handleGetAssetHubLocationRequest(locationId: string) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const result = await getAssetHubLocation({
    userId: session.user.id,
    locationId,
  })
  return Response.json(result)
}

export async function handleUpdateAssetHubLocationRequest(request: Request, locationId: string) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = await request.json()
  const result = await updateAssetHubLocation({
    userId: session.user.id,
    locationId,
    body,
  })
  return Response.json(result)
}

export async function handleDeleteAssetHubLocationRequest(locationId: string) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const result = await deleteAssetHubLocation({
    userId: session.user.id,
    locationId,
  })
  return Response.json(result)
}

export async function handleListAssetHubVoicesRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const result = await listAssetHubVoices({
    userId: session.user.id,
    folderId: readFolderId(request),
  })
  return Response.json(result)
}

export async function handleCreateAssetHubVoiceRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = await request.json()
  const result = await createAssetHubVoice({
    userId: session.user.id,
    body,
  })
  return Response.json(result)
}

export async function handleDeleteAssetHubVoiceRequest(voiceId: string) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const result = await deleteAssetHubVoice({
    userId: session.user.id,
    voiceId,
  })
  return Response.json(result)
}

export async function handleUpdateAssetHubVoiceRequest(request: Request, voiceId: string) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = await request.json()
  const result = await updateAssetHubVoice({
    userId: session.user.id,
    voiceId,
    body,
  })
  return Response.json(result)
}

export async function handleUploadAssetHubVoiceRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const formData = await request.formData()
  const result = await uploadAssetHubVoiceFile({
    userId: session.user.id,
    file: formData.get('file') as File | null,
    name: formData.get('name') as string | null,
    folderId: formData.get('folderId') as string | null,
    description: formData.get('description') as string | null,
  })
  return Response.json(result)
}

export async function handleListAssetHubPickerItemsRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const result = await listAssetHubPickerItems({
    userId: session.user.id,
    type: readAssetHubPickerType(request),
  })
  return Response.json(result)
}

export async function handleUpdateAssetHubLabelRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = await request.json()
  const result = await updateAssetHubLabel({
    userId: session.user.id,
    body,
  })
  return Response.json(result)
}

export async function handleSelectAssetHubImageRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = await request.json()
  const result = await selectAssetHubImage({
    userId: session.user.id,
    body,
  })
  return Response.json(result)
}

export async function handleAssetHubGenerateImageRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = await request.json().catch(() => ({}))
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitAssetHubGenerateImageTask({
    userId: session.user.id,
    locale,
    requestId: getRequestId(request),
    body,
  })
  return Response.json(result)
}

export async function handleAssetHubModifyImageRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = await request.json()
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitAssetHubModifyImageTask({
    userId: session.user.id,
    locale,
    requestId: getRequestId(request),
    body,
  })
  return Response.json(result)
}

export async function handleAssetHubVoiceDesignRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitAssetHubVoiceDesignTask({
    userId: session.user.id,
    locale,
    requestId: getRequestId(request),
    body,
  })
  return Response.json(result)
}

export async function handleAssetHubAiModifyCharacterRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const payload = await request.json()
  return submitAssetHubAiModifyCharacter({
    request,
    userId: session.user.id,
    body: payload,
  })
}

export async function handleAssetHubAiModifyLocationRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const payload = await request.json()
  return submitAssetHubAiModifyLocation({
    request,
    userId: session.user.id,
    body: payload,
  })
}

export async function handleAssetHubAiDesignCharacterRequest(request: Request) {
  return handleAssetHubAiDesignRequest({
    request,
    routePath: '/api/asset-hub/ai-design-character',
    taskType: TASK_TYPE.ASSET_HUB_AI_DESIGN_CHARACTER,
    targetType: 'GlobalAssetHubCharacterDesign',
    digestPrefix: 'character',
  })
}

export async function handleAssetHubAiDesignLocationRequest(request: Request) {
  return handleAssetHubAiDesignRequest({
    request,
    routePath: '/api/asset-hub/ai-design-location',
    taskType: TASK_TYPE.ASSET_HUB_AI_DESIGN_LOCATION,
    targetType: 'GlobalAssetHubLocationDesign',
    digestPrefix: 'location',
  })
}

