import { ApiError } from '@/lib/api-errors'
import { isArtStyleValue } from '@/lib/constants'
import { normalizeImageGenerationCount } from '@/lib/image-generation/count'
import { attachMediaFieldsToGlobalLocation, attachMediaFieldsToGlobalVoice } from '@/lib/media/attach'
import { resolveMediaRefFromLegacyValue } from '@/lib/media/service'
import { prisma } from '@engine/prisma'

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

async function ensureOwnedFolderOrThrow(userId: string, folderId: string) {
  const folder = await prisma.globalAssetFolder.findUnique({
    where: { id: folderId },
  })
  if (!folder || folder.userId !== userId) {
    throw new ApiError('INVALID_PARAMS')
  }
}

async function ensureOwnedLocationOrThrow(userId: string, locationId: string, errorCode: 'NOT_FOUND' | 'FORBIDDEN') {
  const location = await prisma.globalLocation.findUnique({
    where: { id: locationId },
    include: { images: true },
  })
  if (!location || location.userId !== userId) {
    throw new ApiError(errorCode)
  }
  return location
}

async function ensureOwnedVoiceOrThrow(userId: string, voiceId: string, errorCode: 'NOT_FOUND' | 'FORBIDDEN') {
  const voice = await prisma.globalVoice.findUnique({
    where: { id: voiceId },
  })
  if (!voice) {
    throw new ApiError('NOT_FOUND')
  }
  if (voice.userId !== userId) {
    throw new ApiError(errorCode)
  }
  return voice
}

export async function listAssetHubLocations(input: {
  userId: string
  folderId: string | null
}) {
  const where: Record<string, unknown> = { userId: input.userId }
  if (input.folderId === 'null') {
    where.folderId = null
  } else if (input.folderId) {
    where.folderId = input.folderId
  }

  const locations = await prisma.globalLocation.findMany({
    where,
    include: { images: true },
    orderBy: { createdAt: 'desc' },
  })

  const signedLocations = await Promise.all(
    locations.map((location) => attachMediaFieldsToGlobalLocation(location)),
  )

  return { locations: signedLocations }
}

export async function createAssetHubLocation(input: {
  userId: string
  body: unknown
}) {
  const body = toObject(input.body)
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const summary = typeof body.summary === 'string' ? body.summary.trim() : ''
  const folderId = typeof body.folderId === 'string' ? body.folderId : null
  const artStyle = typeof body.artStyle === 'string' ? body.artStyle.trim() : ''
  const count = Object.prototype.hasOwnProperty.call(body, 'count')
    ? normalizeImageGenerationCount('location', body.count)
    : 1

  if (!name) {
    throw new ApiError('INVALID_PARAMS')
  }
  if (!isArtStyleValue(artStyle)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'INVALID_ART_STYLE',
      message: 'artStyle is required and must be a supported value',
    })
  }

  if (folderId) {
    await ensureOwnedFolderOrThrow(input.userId, folderId)
  }

  const location = await prisma.globalLocation.create({
    data: {
      userId: input.userId,
      folderId,
      name,
      artStyle,
      summary: summary || null,
    },
  })

  await prisma.globalLocationImage.createMany({
    data: Array.from({ length: count }, (_unused, imageIndex) => ({
      locationId: location.id,
      imageIndex,
      description: summary || name,
    })),
  })

  const locationWithImages = await prisma.globalLocation.findUnique({
    where: { id: location.id },
    include: { images: true },
  })

  const withMedia = locationWithImages
    ? await attachMediaFieldsToGlobalLocation(locationWithImages)
    : locationWithImages

  return { success: true, location: withMedia }
}

export async function getAssetHubLocation(input: {
  userId: string
  locationId: string
}) {
  const location = await ensureOwnedLocationOrThrow(input.userId, input.locationId, 'NOT_FOUND')
  return { location }
}

export async function updateAssetHubLocation(input: {
  userId: string
  locationId: string
  body: unknown
}) {
  await ensureOwnedLocationOrThrow(input.userId, input.locationId, 'FORBIDDEN')
  const body = toObject(input.body)

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = typeof body.name === 'string' ? body.name.trim() : body.name
  if (body.summary !== undefined) updateData.summary = typeof body.summary === 'string' ? body.summary.trim() || null : null
  if (body.folderId !== undefined) {
    if (body.folderId) {
      if (typeof body.folderId !== 'string') {
        throw new ApiError('INVALID_PARAMS')
      }
      await ensureOwnedFolderOrThrow(input.userId, body.folderId)
    }
    updateData.folderId = body.folderId || null
  }

  const updatedLocation = await prisma.globalLocation.update({
    where: { id: input.locationId },
    data: updateData,
    include: { images: true },
  })

  return { success: true, location: updatedLocation }
}

export async function deleteAssetHubLocation(input: {
  userId: string
  locationId: string
}) {
  await ensureOwnedLocationOrThrow(input.userId, input.locationId, 'FORBIDDEN')
  await prisma.globalLocation.delete({
    where: { id: input.locationId },
  })
  return { success: true }
}

export async function listAssetHubVoices(input: {
  userId: string
  folderId: string | null
}) {
  const where: Record<string, unknown> = { userId: input.userId }
  if (input.folderId === 'null') {
    where.folderId = null
  } else if (input.folderId) {
    where.folderId = input.folderId
  }

  const voices = await prisma.globalVoice.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  const signedVoices = await Promise.all(
    voices.map((voice) => attachMediaFieldsToGlobalVoice(voice)),
  )

  return { voices: signedVoices }
}

export async function createAssetHubVoice(input: {
  userId: string
  body: unknown
}) {
  const body = toObject(input.body)
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const folderId = typeof body.folderId === 'string' ? body.folderId : null
  const voiceId = typeof body.voiceId === 'string' ? body.voiceId : null
  const voiceType = typeof body.voiceType === 'string' && body.voiceType ? body.voiceType : 'qwen-designed'
  const customVoiceUrl = typeof body.customVoiceUrl === 'string' ? body.customVoiceUrl : null
  const voicePrompt = typeof body.voicePrompt === 'string' ? body.voicePrompt.trim() || null : null
  const gender = typeof body.gender === 'string' ? body.gender : null
  const language = typeof body.language === 'string' && body.language ? body.language : 'zh'

  if (!name) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (folderId) {
    await ensureOwnedFolderOrThrow(input.userId, folderId)
  }

  const customVoiceMedia = await resolveMediaRefFromLegacyValue(customVoiceUrl)
  const voice = await prisma.globalVoice.create({
    data: {
      userId: input.userId,
      folderId,
      name,
      description: description || null,
      voiceId,
      voiceType,
      customVoiceUrl,
      customVoiceMediaId: customVoiceMedia?.id || null,
      voicePrompt,
      gender,
      language,
    },
  })

  const withMedia = await attachMediaFieldsToGlobalVoice(voice)
  return { success: true, voice: withMedia }
}

export async function updateAssetHubVoice(input: {
  userId: string
  voiceId: string
  body: unknown
}) {
  const voice = await ensureOwnedVoiceOrThrow(input.userId, input.voiceId, 'FORBIDDEN')
  const body = toObject(input.body)

  const updatedVoice = await prisma.globalVoice.update({
    where: { id: input.voiceId },
    data: {
      name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : voice.name,
      description: body.description !== undefined
        ? (typeof body.description === 'string' ? body.description.trim() || null : null)
        : voice.description,
      folderId: body.folderId !== undefined ? body.folderId : voice.folderId,
    },
  })

  return { success: true, voice: updatedVoice }
}

export async function deleteAssetHubVoice(input: {
  userId: string
  voiceId: string
}) {
  await ensureOwnedVoiceOrThrow(input.userId, input.voiceId, 'FORBIDDEN')
  await prisma.globalVoice.delete({
    where: { id: input.voiceId },
  })
  return { success: true }
}

export async function uploadAssetHubVoiceFile(input: {
  userId: string
  file: File | null
  name: string | null
  folderId: string | null
  description: string | null
}) {
  if (!input.file) {
    throw new ApiError('INVALID_PARAMS')
  }
  const trimmedName = typeof input.name === 'string' ? input.name.trim() : ''
  if (!trimmedName) {
    throw new ApiError('INVALID_PARAMS')
  }

  const audioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/aac']
  const isAudioFile = audioTypes.includes(input.file.type) || !!input.file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)
  if (!isAudioFile) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (input.folderId) {
    await ensureOwnedFolderOrThrow(input.userId, input.folderId)
  }

  const { generateUniqueKey, getSignedUrl, uploadObject } = await import('@/lib/storage')
  const arrayBuffer = await input.file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const audioExt = input.file.name.split('.').pop()?.toLowerCase() || 'mp3'
  const key = generateUniqueKey(`voices/${input.userId}/${Date.now()}`, audioExt)
  const customVoiceUrl = await uploadObject(buffer, key)

  const voice = await prisma.globalVoice.create({
    data: {
      userId: input.userId,
      folderId: input.folderId || null,
      name: trimmedName,
      description: input.description?.trim() || null,
      voiceId: null,
      voiceType: 'uploaded',
      customVoiceUrl,
      voicePrompt: null,
      gender: null,
      language: 'zh',
    },
  })

  const signedUrl = getSignedUrl(customVoiceUrl, 7 * 24 * 3600)
  return {
    success: true,
    voice: {
      ...voice,
      customVoiceUrl: signedUrl,
    },
  }
}
