import { ApiError } from '@/lib/api-errors'
import { resolveTaskLocale } from '@/lib/task/resolve-locale'
import { isErrorResponse, requireProjectAuth, requireProjectAuthLight } from '@engine/api-auth'
import {
  createNovelPromotionEpisodesBatch,
  createNovelPromotionEpisode,
  deleteNovelPromotionEpisode,
  deleteVideoEditorProjectByEpisodeId,
  getNovelPromotionEpisodeDetail,
  getNovelPromotionProjectAssets,
  getNovelPromotionProjectCapabilityOverrides,
  getVideoEditorProjectByEpisodeId,
  listNovelPromotionEpisodes,
  splitNovelPromotionEpisodesByMarkers,
  updateNovelPromotionEpisode,
  updateNovelPromotionProjectConfig,
  upsertVideoEditorProject,
} from '@engine/services/novel-promotion-project-service'
import {
  clearNovelPromotionStoryboardError,
  createNovelPromotionPanel,
  createNovelPromotionStoryboardGroup,
  deleteNovelPromotionPanel,
  deleteNovelPromotionStoryboardGroup,
  getNovelPromotionStoryboards,
  moveNovelPromotionStoryboardGroup,
  patchNovelPromotionPanel,
  putNovelPromotionPanel,
  updateNovelPromotionClip,
  updateNovelPromotionPanelLink,
  updateNovelPromotionPhotographyPlan,
} from '@engine/services/novel-promotion-editing-service'
import {
  confirmNovelPromotionCharacterSelection,
  confirmNovelPromotionLocationSelection,
  copyNovelPromotionAssetFromGlobal,
  createNovelPromotionCharacter,
  createNovelPromotionCharacterAppearance,
  createNovelPromotionLocation,
  deleteNovelPromotionCharacter,
  deleteNovelPromotionCharacterAppearance,
  deleteNovelPromotionLocation,
  selectNovelPromotionCharacterImage,
  selectNovelPromotionLocationImage,
  updateNovelPromotionAssetLabel,
  updateNovelPromotionCharacter,
  updateNovelPromotionCharacterAppearance,
  updateNovelPromotionLocation,
  uploadNovelPromotionAssetImage,
} from '@engine/services/novel-promotion-asset-service'
import {
  createNovelPromotionVoiceLine,
  deleteNovelPromotionVoiceLine,
  getNovelPromotionSpeakerVoices,
  getNovelPromotionVoiceLines,
  saveDesignedNovelPromotionCharacterVoice,
  updateNovelPromotionCharacterVoiceSettings,
  updateNovelPromotionSpeakerVoice,
  updateNovelPromotionVoiceLine,
  uploadNovelPromotionCharacterVoiceFile,
} from '@engine/services/novel-promotion-voice-service'
import {
  downloadNovelPromotionImages,
  downloadNovelPromotionVideos,
  downloadNovelPromotionVoices,
  listNovelPromotionVideoUrls,
} from '@engine/services/novel-promotion-download-service'

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function readOptionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function readNullableString(value: unknown) {
  if (value === null) return null
  return typeof value === 'string' ? value : undefined
}

function readOptionalNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function readNullableNumber(value: unknown) {
  if (value === null) return null
  return readOptionalNumber(value)
}

function readOptionalBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}

function readBooleanRecord(value: unknown): Record<string, boolean> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const entries = Object.entries(value)
  return Object.fromEntries(entries.filter(([, item]) => typeof item === 'boolean')) as Record<string, boolean>
}

function readFormString(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : undefined
}

async function requireLightProjectAccess(projectId: string) {
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult
  return authResult
}

async function requireFullProjectAccess(projectId: string) {
  const authResult = await requireProjectAuth(projectId)
  if (isErrorResponse(authResult)) return authResult
  return authResult
}

export async function handleNovelPromotionProjectCapabilityOverridesRequest(projectId: string) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const payload = await getNovelPromotionProjectCapabilityOverrides(projectId)
  return Response.json(payload)
}

export async function handleNovelPromotionProjectConfigUpdateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const payload = await updateNovelPromotionProjectConfig({
    projectId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name,
    project: authResult.project,
    body: await request.json(),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionProjectAssetsRequest(projectId: string) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const payload = await getNovelPromotionProjectAssets(projectId)
  return Response.json(payload)
}

export async function handleNovelPromotionEpisodesListRequest(projectId: string) {
  const authResult = await requireFullProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const payload = await listNovelPromotionEpisodes(authResult.novelData.id)
  return Response.json(payload)
}

export async function handleNovelPromotionEpisodeCreateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireFullProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await createNovelPromotionEpisode({
    novelPromotionProjectId: authResult.novelData.id,
    name,
    description: readNullableString(body.description),
  })
  return Response.json(payload, { status: 201 })
}

export async function handleNovelPromotionEpisodeDetailRequest(
  projectId: string,
  episodeId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const payload = await getNovelPromotionEpisodeDetail({
    projectId,
    episodeId,
  })
  return Response.json(payload)
}

export async function handleNovelPromotionEpisodeUpdateRequest(
  request: Request,
  projectId: string,
  episodeId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const payload = await updateNovelPromotionEpisode({
    episodeId,
    body: await request.json(),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionEpisodeDeleteRequest(
  projectId: string,
  episodeId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const payload = await deleteNovelPromotionEpisode({
    projectId,
    episodeId,
  })
  return Response.json(payload)
}

export async function handleNovelPromotionStoryboardsRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const episodeId = new URL(request.url).searchParams.get('episodeId')
  if (!episodeId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await getNovelPromotionStoryboards(episodeId)
  return Response.json(payload)
}

export async function handleNovelPromotionStoryboardErrorClearRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const storyboardId = typeof body.storyboardId === 'string' ? body.storyboardId : ''
  if (!storyboardId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await clearNovelPromotionStoryboardError(storyboardId)
  return Response.json(payload)
}

export async function handleNovelPromotionEditorGetRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const episodeId = (new URL(request.url)).searchParams.get('episodeId')
  if (!episodeId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await getVideoEditorProjectByEpisodeId(episodeId)
  return Response.json(payload, { status: 200 })
}

export async function handleNovelPromotionEditorUpsertRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const episodeId = typeof body.episodeId === 'string' ? body.episodeId : ''
  if (!episodeId || !('projectData' in body)) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await upsertVideoEditorProject({
    projectId,
    episodeId,
    projectData: body.projectData,
  })
  return Response.json(payload)
}

export async function handleNovelPromotionEditorDeleteRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const episodeId = (new URL(request.url)).searchParams.get('episodeId')
  if (!episodeId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await deleteVideoEditorProjectByEpisodeId(episodeId)
  return Response.json(payload)
}

export async function handleNovelPromotionStoryboardGroupCreateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const payload = await createNovelPromotionStoryboardGroup({
    episodeId: readOptionalString(body.episodeId) || '',
    insertIndex: readOptionalNumber(body.insertIndex),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionStoryboardGroupMoveRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const payload = await moveNovelPromotionStoryboardGroup({
    episodeId: readOptionalString(body.episodeId) || '',
    clipId: readOptionalString(body.clipId) || '',
    direction: readOptionalString(body.direction) || '',
  })
  return Response.json(payload)
}

export async function handleNovelPromotionStoryboardGroupDeleteRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const storyboardId = new URL(request.url).searchParams.get('storyboardId')
  if (!storyboardId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await deleteNovelPromotionStoryboardGroup(storyboardId)
  return Response.json(payload)
}

export async function handleNovelPromotionPanelCreateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const payload = await createNovelPromotionPanel({
    storyboardId: readOptionalString(body.storyboardId) || '',
    shotType: readNullableString(body.shotType),
    cameraMove: readNullableString(body.cameraMove),
    description: readNullableString(body.description),
    location: readNullableString(body.location),
    characters: readNullableString(body.characters),
    srtStart: readNullableNumber(body.srtStart),
    srtEnd: readNullableNumber(body.srtEnd),
    duration: readNullableNumber(body.duration),
    videoPrompt: readNullableString(body.videoPrompt),
    firstLastFramePrompt: readNullableString(body.firstLastFramePrompt),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionPanelDeleteRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const panelId = new URL(request.url).searchParams.get('panelId')
  if (!panelId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await deleteNovelPromotionPanel(panelId)
  return Response.json(payload)
}

export async function handleNovelPromotionPanelPatchRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const payload = await patchNovelPromotionPanel({
    panelId: readOptionalString(body.panelId),
    storyboardId: readOptionalString(body.storyboardId),
    panelIndex: readOptionalNumber(body.panelIndex),
    videoPrompt: readNullableString(body.videoPrompt),
    firstLastFramePrompt: readNullableString(body.firstLastFramePrompt),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionPanelPutRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const payload = await putNovelPromotionPanel({
    storyboardId: readOptionalString(body.storyboardId),
    panelIndex: readOptionalNumber(body.panelIndex),
    panelNumber: readNullableNumber(body.panelNumber),
    shotType: readNullableString(body.shotType),
    cameraMove: readNullableString(body.cameraMove),
    description: readNullableString(body.description),
    location: readNullableString(body.location),
    characters: readNullableString(body.characters),
    srtStart: body.srtStart,
    srtEnd: body.srtEnd,
    duration: body.duration,
    videoPrompt: readNullableString(body.videoPrompt),
    firstLastFramePrompt: readNullableString(body.firstLastFramePrompt),
    actingNotes: body.actingNotes,
    photographyRules: body.photographyRules,
  })
  return Response.json(payload)
}

export async function handleNovelPromotionCharacterCreateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireFullProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const rawBody = await request.json().catch(() => ({}))
  const payload = await createNovelPromotionCharacter({
    projectId,
    novelPromotionProjectId: authResult.novelData.id,
    body: rawBody,
    taskLocale: resolveTaskLocale(request, rawBody),
    acceptLanguage: request.headers.get('accept-language') || '',
    cookieHeader: request.headers.get('cookie') || '',
  })
  return Response.json(payload)
}

export async function handleNovelPromotionCharacterUpdateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const payload = await updateNovelPromotionCharacter({
    characterId: readOptionalString(body.characterId) || '',
    name: body.name,
    introduction: body.introduction,
  })
  return Response.json(payload)
}

export async function handleNovelPromotionCharacterDeleteRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const characterId = (new URL(request.url)).searchParams.get('id')
  if (!characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await deleteNovelPromotionCharacter({
    projectId,
    userId: authResult.session.user.id,
    characterId,
  })
  return Response.json(payload)
}

export async function handleNovelPromotionCharacterAppearanceCreateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const payload = await createNovelPromotionCharacterAppearance({
    projectId,
    body: await request.json().catch(() => ({})),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionCharacterAppearanceUpdateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const payload = await updateNovelPromotionCharacterAppearance({
    projectId,
    body: await request.json().catch(() => ({})),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionCharacterAppearanceDeleteRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const characterId = (new URL(request.url)).searchParams.get('characterId')
  const appearanceId = (new URL(request.url)).searchParams.get('appearanceId')
  if (!characterId || !appearanceId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await deleteNovelPromotionCharacterAppearance({
    characterId,
    appearanceId,
  })
  return Response.json(payload)
}

export async function handleNovelPromotionCharacterSelectionConfirmRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const characterId = readOptionalString(body.characterId)
  const appearanceId = readOptionalString(body.appearanceId)
  if (!characterId || !appearanceId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await confirmNovelPromotionCharacterSelection({
    characterId,
    appearanceId,
  })
  return Response.json(payload)
}

export async function handleNovelPromotionCharacterImageSelectRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const characterId = readOptionalString(body.characterId)
  const appearanceId = readOptionalString(body.appearanceId)
  if (!characterId || !appearanceId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await selectNovelPromotionCharacterImage({
    characterId,
    appearanceId,
    selectedIndex: body.selectedIndex === null ? null : readOptionalNumber(body.selectedIndex) ?? null,
  })
  return Response.json(payload)
}

export async function handleNovelPromotionAppearanceDescriptionUpdateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const characterId = readOptionalString(body.characterId)
  const appearanceId = readOptionalString(body.appearanceId)
  const newDescription = readOptionalString(body.newDescription)
  if (!characterId || !appearanceId || !newDescription) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await updateNovelPromotionCharacterAppearance({
    projectId,
    body: {
      characterId,
      appearanceId,
      description: newDescription,
      descriptionIndex: readOptionalNumber(body.descriptionIndex),
    },
  })
  return Response.json(payload)
}

export async function handleNovelPromotionLocationCreateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireFullProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const payload = await createNovelPromotionLocation({
    novelPromotionProjectId: authResult.novelData.id,
    body: await request.json().catch(() => ({})),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionLocationUpdateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const payload = await updateNovelPromotionLocation({
    body: toRecord(await request.json().catch(() => ({}))),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionLocationDeleteRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const locationId = (new URL(request.url)).searchParams.get('id')
  if (!locationId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await deleteNovelPromotionLocation(locationId)
  return Response.json(payload)
}

export async function handleNovelPromotionLocationSelectionConfirmRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const locationId = readOptionalString(body.locationId)
  if (!locationId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await confirmNovelPromotionLocationSelection(locationId)
  return Response.json(payload)
}

export async function handleNovelPromotionLocationImageSelectRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const locationId = readOptionalString(body.locationId)
  if (!locationId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await selectNovelPromotionLocationImage({
    locationId,
    selectedIndex: body.selectedIndex === null ? null : readOptionalNumber(body.selectedIndex) ?? null,
  })
  return Response.json(payload)
}

export async function handleNovelPromotionLocationDescriptionUpdateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const locationId = readOptionalString(body.locationId)
  const newDescription = readOptionalString(body.newDescription)
  if (!locationId || !newDescription) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await updateNovelPromotionLocation({
    body: {
      locationId,
      imageIndex: readOptionalNumber(body.imageIndex) ?? 0,
      description: newDescription,
    },
  })
  return Response.json(payload)
}

export async function handleNovelPromotionAssetLabelUpdateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const type = readOptionalString(body.type)
  const id = readOptionalString(body.id)
  const newName = readOptionalString(body.newName)
  if (!type || !id || !newName) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await updateNovelPromotionAssetLabel({
    type,
    id,
    newName,
    appearanceIndex: readOptionalNumber(body.appearanceIndex),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionAssetImageUploadRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const formData = await request.formData()
  const file = formData.get('file')
  const type = readFormString(formData.get('type'))
  const id = readFormString(formData.get('id'))
  const labelText = readFormString(formData.get('labelText'))
  if (!(file instanceof File) || !type || !id || !labelText) {
    throw new ApiError('INVALID_PARAMS')
  }

  const imageIndexRaw = readFormString(formData.get('imageIndex'))
  const payload = await uploadNovelPromotionAssetImage({
    file,
    type,
    id,
    appearanceId: readFormString(formData.get('appearanceId')) ?? null,
    imageIndex: imageIndexRaw !== undefined ? Number(imageIndexRaw) : null,
    labelText,
  })
  return Response.json(payload)
}

export async function handleNovelPromotionAssetCopyFromGlobalRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const type = readOptionalString(body.type)
  const targetId = readOptionalString(body.targetId)
  const globalAssetId = readOptionalString(body.globalAssetId)
  if (!type || !targetId || !globalAssetId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await copyNovelPromotionAssetFromGlobal({
    userId: authResult.session.user.id,
    type,
    targetId,
    globalAssetId,
  })
  return Response.json(payload)
}

export async function handleNovelPromotionCharacterVoicePatchRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const characterId = readOptionalString(body.characterId)
  if (!characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await updateNovelPromotionCharacterVoiceSettings({
    characterId,
    voiceType: readNullableString(body.voiceType) ?? null,
    voiceId: readNullableString(body.voiceId) ?? null,
    customVoiceUrl: readNullableString(body.customVoiceUrl) ?? null,
  })
  return Response.json(payload)
}

export async function handleNovelPromotionCharacterVoicePostRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const body = toRecord(await request.json().catch(() => ({})))
    const characterId = readOptionalString(body.characterId)
    const voiceDesign = toRecord(body.voiceDesign)
    const voiceId = readOptionalString(voiceDesign.voiceId)
    const audioBase64 = readOptionalString(voiceDesign.audioBase64)
    if (!characterId || !voiceId || !audioBase64) {
      throw new ApiError('INVALID_PARAMS')
    }

    const payload = await saveDesignedNovelPromotionCharacterVoice({
      projectId,
      characterId,
      voiceId,
      audioBase64,
    })
    return Response.json(payload)
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const characterId = readFormString(formData.get('characterId'))
  if (!(file instanceof File) || !characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await uploadNovelPromotionCharacterVoiceFile({
    projectId,
    characterId,
    fileName: file.name,
    fileType: file.type,
    buffer: Buffer.from(await file.arrayBuffer()),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionVoiceLinesListRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const episodeId = (new URL(request.url)).searchParams.get('episodeId')
  const speakersOnly = (new URL(request.url)).searchParams.get('speakersOnly')
  const payload = await getNovelPromotionVoiceLines({
    projectId,
    episodeId,
    speakersOnly: speakersOnly === '1',
  })
  return Response.json(payload)
}

export async function handleNovelPromotionVoiceLineCreateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const payload = await createNovelPromotionVoiceLine({
    projectId,
    episodeId: readOptionalString(body.episodeId) || '',
    content: readOptionalString(body.content) || '',
    speaker: readOptionalString(body.speaker) || '',
    matchedPanelId: readNullableString(body.matchedPanelId),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionVoiceLineUpdateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const payload = await updateNovelPromotionVoiceLine({
    body: toRecord(await request.json().catch(() => ({}))),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionVoiceLineDeleteRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const lineId = (new URL(request.url)).searchParams.get('lineId')
  if (!lineId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await deleteNovelPromotionVoiceLine(lineId)
  return Response.json(payload)
}

export async function handleNovelPromotionSpeakerVoicesRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const episodeId = (new URL(request.url)).searchParams.get('episodeId')
  if (!episodeId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await getNovelPromotionSpeakerVoices(episodeId)
  return Response.json(payload)
}

export async function handleNovelPromotionSpeakerVoiceUpdateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const payload = await updateNovelPromotionSpeakerVoice({
    projectId,
    body: await request.json().catch(() => null),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionImagesDownloadRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  return downloadNovelPromotionImages({
    projectId,
    projectName: authResult.project.name,
    episodeId: (new URL(request.url)).searchParams.get('episodeId'),
  })
}

export async function handleNovelPromotionVideosDownloadRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  return downloadNovelPromotionVideos({
    projectId,
    projectName: authResult.project.name,
    episodeId: readOptionalString(body.episodeId),
    panelPreferences: readBooleanRecord(body.panelPreferences),
  })
}

export async function handleNovelPromotionVoicesDownloadRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  return downloadNovelPromotionVoices({
    projectId,
    projectName: authResult.project.name,
    episodeId: (new URL(request.url)).searchParams.get('episodeId'),
  })
}

export async function handleNovelPromotionVideoUrlsRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const payload = await listNovelPromotionVideoUrls({
    projectId,
    projectName: authResult.project.name,
    episodeId: readOptionalString(body.episodeId),
    panelPreferences: readBooleanRecord(body.panelPreferences),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionClipUpdateRequest(
  request: Request,
  projectId: string,
  clipId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const payload = await updateNovelPromotionClip({
    clipId,
    body: toRecord(await request.json().catch(() => ({}))),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionPanelLinkUpdateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const storyboardId = readOptionalString(body.storyboardId)
  const panelIndex = readOptionalNumber(body.panelIndex)
  const linked = readOptionalBoolean(body.linked)
  if (!storyboardId || panelIndex === undefined || linked === undefined) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await updateNovelPromotionPanelLink({
    storyboardId,
    panelIndex,
    linked,
  })
  return Response.json(payload)
}

export async function handleNovelPromotionPhotographyPlanUpdateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const storyboardId = readOptionalString(body.storyboardId)
  if (!storyboardId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await updateNovelPromotionPhotographyPlan({
    storyboardId,
    photographyPlan: body.photographyPlan,
  })
  return Response.json(payload)
}

export async function handleNovelPromotionEpisodesBatchCreateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  if (!Array.isArray(body.episodes)) {
    throw new ApiError('INVALID_PARAMS')
  }

  const episodes = body.episodes.map((item) => {
    const row = toRecord(item)
    return {
      name: readOptionalString(row.name) || '',
      description: readOptionalString(row.description),
      novelText: readOptionalString(row.novelText) || '',
    }
  })
  if (episodes.some((episode) => !episode.name || !episode.novelText)) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await createNovelPromotionEpisodesBatch({
    projectId,
    episodes,
    clearExisting: body.clearExisting === true,
    importStatus: readOptionalString(body.importStatus),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionEpisodesSplitByMarkersRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const payload = await splitNovelPromotionEpisodesByMarkers({
    projectId,
    userId: authResult.session.user.id,
    username: authResult.session.user.name || authResult.session.user.email || 'unknown',
    content: readOptionalString(body.content) || '',
  })
  return Response.json(payload)
}

