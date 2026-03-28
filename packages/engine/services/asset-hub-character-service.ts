import { logError as _ulogError } from '@/lib/logging/core'
import { ApiError } from '@/lib/api-errors'
import { PRIMARY_APPEARANCE_INDEX, isArtStyleValue } from '@/lib/constants'
import { encodeImageUrls } from '@/lib/contracts/image-urls-contract'
import { normalizeImageGenerationCount } from '@/lib/image-generation/count'
import { attachMediaFieldsToGlobalCharacter } from '@/lib/media/attach'
import { resolveMediaRefFromLegacyValue } from '@/lib/media/service'
import {
  collectBailianManagedVoiceIds,
  cleanupUnreferencedBailianVoices,
} from '@/lib/providers/bailian'
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

async function ensureOwnedCharacterOrThrow(userId: string, characterId: string, errorCode: 'NOT_FOUND' | 'FORBIDDEN') {
  const character = await prisma.globalCharacter.findUnique({
    where: { id: characterId },
    include: { appearances: true },
  })
  if (!character || character.userId !== userId) {
    throw new ApiError(errorCode)
  }
  return character
}

export async function listAssetHubCharacters(input: {
  userId: string
  folderId: string | null
}) {
  const where: Record<string, unknown> = { userId: input.userId }
  if (input.folderId === 'null') {
    where.folderId = null
  } else if (input.folderId) {
    where.folderId = input.folderId
  }

  const characters = await prisma.globalCharacter.findMany({
    where,
    include: { appearances: true },
    orderBy: { createdAt: 'desc' },
  })

  const signedCharacters = await Promise.all(
    characters.map((character) => attachMediaFieldsToGlobalCharacter(character)),
  )

  return { characters: signedCharacters }
}

export async function createAssetHubCharacter(input: {
  userId: string
  body: unknown
  taskLocale?: string | null
  cookieHeader?: string | null
  acceptLanguage?: string | null
}) {
  const body = toObject(input.body)
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const description = typeof body.description === 'string' ? body.description : ''
  const folderId = typeof body.folderId === 'string' ? body.folderId : null
  const initialImageUrl = typeof body.initialImageUrl === 'string' ? body.initialImageUrl : null
  const referenceImageUrl = typeof body.referenceImageUrl === 'string' ? body.referenceImageUrl : null
  const referenceImageUrls = Array.isArray(body.referenceImageUrls) ? body.referenceImageUrls.filter((item): item is string => typeof item === 'string') : null
  const generateFromReference = body.generateFromReference === true
  const artStyle = typeof body.artStyle === 'string' ? body.artStyle.trim() : ''
  const customDescription = typeof body.customDescription === 'string' ? body.customDescription : undefined
  const bodyMeta = toObject(body.meta)
  const count = normalizeImageGenerationCount('reference-to-character', body.count)

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

  let allReferenceImages: string[] = []
  if (referenceImageUrls && referenceImageUrls.length > 0) {
    allReferenceImages = referenceImageUrls.slice(0, 5)
  } else if (referenceImageUrl) {
    allReferenceImages = [referenceImageUrl]
  }

  const character = await prisma.globalCharacter.create({
    data: {
      userId: input.userId,
      folderId,
      name,
      aliases: null,
    },
  })

  const descText = description.trim() || `${name} 的角色设定`
  const imageMedia = await resolveMediaRefFromLegacyValue(initialImageUrl)
  const appearance = await prisma.globalCharacterAppearance.create({
    data: {
      characterId: character.id,
      appearanceIndex: PRIMARY_APPEARANCE_INDEX,
      changeReason: '初始形象',
      artStyle,
      description: descText,
      descriptions: JSON.stringify([descText]),
      imageUrl: initialImageUrl,
      imageMediaId: imageMedia?.id || null,
      imageUrls: encodeImageUrls(initialImageUrl ? [initialImageUrl] : []),
      previousImageUrls: encodeImageUrls([]),
    },
  })

  if (generateFromReference && allReferenceImages.length > 0) {
    const { getBaseUrl } = await import('@/lib/env')
    const baseUrl = getBaseUrl()
    fetch(`${baseUrl}/api/asset-hub/reference-to-character`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(input.cookieHeader ? { Cookie: input.cookieHeader } : {}),
        ...(input.acceptLanguage ? { 'Accept-Language': input.acceptLanguage } : {}),
      },
      body: JSON.stringify({
        referenceImageUrls: allReferenceImages,
        characterName: name,
        characterId: character.id,
        appearanceId: appearance.id,
        count,
        isBackgroundJob: true,
        artStyle,
        customDescription: customDescription || undefined,
        locale: input.taskLocale || undefined,
        meta: {
          ...bodyMeta,
          locale: input.taskLocale || bodyMeta.locale || undefined,
        },
      }),
    }).catch((error) => {
      _ulogError('[Characters API] 后台生成任务触发失败:', error)
    })
  }

  const characterWithAppearances = await prisma.globalCharacter.findUnique({
    where: { id: character.id },
    include: { appearances: true },
  })

  const withMedia = characterWithAppearances
    ? await attachMediaFieldsToGlobalCharacter(characterWithAppearances)
    : characterWithAppearances

  return { success: true, character: withMedia }
}

export async function getAssetHubCharacter(input: {
  userId: string
  characterId: string
}) {
  const character = await ensureOwnedCharacterOrThrow(input.userId, input.characterId, 'NOT_FOUND')
  return { character }
}

export async function updateAssetHubCharacter(input: {
  userId: string
  characterId: string
  body: unknown
}) {
  await ensureOwnedCharacterOrThrow(input.userId, input.characterId, 'FORBIDDEN')
  const body = toObject(input.body)

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = typeof body.name === 'string' ? body.name.trim() : body.name
  if (body.aliases !== undefined) updateData.aliases = body.aliases
  if (body.profileData !== undefined) updateData.profileData = body.profileData
  if (body.profileConfirmed !== undefined) updateData.profileConfirmed = body.profileConfirmed
  if (body.voiceId !== undefined) updateData.voiceId = body.voiceId
  if (body.voiceType !== undefined) updateData.voiceType = body.voiceType
  if (body.customVoiceUrl !== undefined) updateData.customVoiceUrl = body.customVoiceUrl
  if (body.globalVoiceId !== undefined) updateData.globalVoiceId = body.globalVoiceId
  if (body.folderId !== undefined) {
    if (body.folderId) {
      if (typeof body.folderId !== 'string') {
        throw new ApiError('INVALID_PARAMS')
      }
      await ensureOwnedFolderOrThrow(input.userId, body.folderId)
    }
    updateData.folderId = body.folderId || null
  }

  const updatedCharacter = await prisma.globalCharacter.update({
    where: { id: input.characterId },
    data: updateData,
    include: { appearances: true },
  })

  return { success: true, character: updatedCharacter }
}

export async function deleteAssetHubCharacter(input: {
  userId: string
  characterId: string
}) {
  const character = await ensureOwnedCharacterOrThrow(input.userId, input.characterId, 'FORBIDDEN')
  const candidateVoiceIds = collectBailianManagedVoiceIds([
    {
      voiceId: character.voiceId,
      voiceType: character.voiceType,
    },
  ])

  await cleanupUnreferencedBailianVoices({
    voiceIds: candidateVoiceIds,
    scope: {
      userId: input.userId,
      excludeGlobalCharacterId: character.id,
    },
  })

  await prisma.globalCharacter.delete({
    where: { id: input.characterId },
  })

  return { success: true }
}

export async function updateAssetHubCharacterAppearance(input: {
  userId: string
  characterId: string
  appearanceIndex: string
  body: unknown
}) {
  await ensureOwnedCharacterOrThrow(input.userId, input.characterId, 'FORBIDDEN')
  const body = toObject(input.body)
  const description = body.description
  const descriptionIndex = body.descriptionIndex
  const changeReason = body.changeReason
  const artStyle = body.artStyle

  const appearance = await prisma.globalCharacterAppearance.findFirst({
    where: {
      characterId: input.characterId,
      appearanceIndex: Number.parseInt(input.appearanceIndex, 10),
    },
  })
  if (!appearance) {
    throw new ApiError('NOT_FOUND')
  }

  const updateData: Record<string, unknown> = {}

  if (description !== undefined) {
    if (typeof description !== 'string') {
      throw new ApiError('INVALID_PARAMS')
    }
    const trimmedDescription = description.trim()
    let descriptions: string[] = []
    if (appearance.descriptions) {
      try {
        descriptions = JSON.parse(appearance.descriptions)
      } catch {
        descriptions = []
      }
    }
    if (descriptions.length === 0) {
      descriptions = [appearance.description || '']
    }
    if (descriptionIndex !== undefined && descriptionIndex !== null) {
      descriptions[Number(descriptionIndex)] = trimmedDescription
    } else {
      descriptions[0] = trimmedDescription
    }
    updateData.descriptions = JSON.stringify(descriptions)
    updateData.description = descriptions[0]
  }

  if (changeReason !== undefined) {
    updateData.changeReason = changeReason
  }
  if (artStyle !== undefined) {
    if (typeof artStyle !== 'string') {
      throw new ApiError('INVALID_PARAMS', {
        code: 'INVALID_ART_STYLE',
        message: 'artStyle must be a supported value',
      })
    }
    const normalizedArtStyle = artStyle.trim()
    if (!isArtStyleValue(normalizedArtStyle)) {
      throw new ApiError('INVALID_PARAMS', {
        code: 'INVALID_ART_STYLE',
        message: 'artStyle must be a supported value',
      })
    }
    updateData.artStyle = normalizedArtStyle
  }

  await prisma.globalCharacterAppearance.update({
    where: { id: appearance.id },
    data: updateData,
  })

  return { success: true }
}

export async function createAssetHubCharacterAppearance(input: {
  userId: string
  characterId: string
  body: unknown
}) {
  const character = await ensureOwnedCharacterOrThrow(input.userId, input.characterId, 'FORBIDDEN')
  const body = toObject(input.body)
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const changeReason = typeof body.changeReason === 'string' ? body.changeReason : undefined
  const inputArtStyle = typeof body.artStyle === 'string' ? body.artStyle.trim() : ''

  if (!description) {
    throw new ApiError('INVALID_PARAMS')
  }

  const maxIndex = character.appearances.reduce((max, appearance) => Math.max(max, appearance.appearanceIndex), 0)
  const fallbackArtStyle = (() => {
    if (inputArtStyle) return inputArtStyle
    const primaryAppearance = character.appearances.find((appearance) => appearance.appearanceIndex === PRIMARY_APPEARANCE_INDEX)
      || character.appearances[0]
    const stored = typeof primaryAppearance?.artStyle === 'string' ? primaryAppearance.artStyle.trim() : ''
    return stored
  })()
  if (!isArtStyleValue(fallbackArtStyle)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'INVALID_ART_STYLE',
      message: 'artStyle is required and must be a supported value',
    })
  }

  const appearance = await prisma.globalCharacterAppearance.create({
    data: {
      characterId: input.characterId,
      appearanceIndex: maxIndex + 1,
      changeReason: changeReason || '形象变化',
      artStyle: fallbackArtStyle,
      description,
      descriptions: JSON.stringify([description]),
      imageUrls: encodeImageUrls([]),
      previousImageUrls: encodeImageUrls([]),
    },
  })

  return { success: true, appearance }
}

export async function deleteAssetHubCharacterAppearance(input: {
  userId: string
  characterId: string
  appearanceIndex: string
}) {
  const character = await ensureOwnedCharacterOrThrow(input.userId, input.characterId, 'FORBIDDEN')
  if (character.appearances.length <= 1) {
    throw new ApiError('INVALID_PARAMS')
  }

  const appearance = await prisma.globalCharacterAppearance.findFirst({
    where: {
      characterId: input.characterId,
      appearanceIndex: Number.parseInt(input.appearanceIndex, 10),
    },
  })
  if (!appearance) {
    throw new ApiError('NOT_FOUND')
  }

  await prisma.globalCharacterAppearance.delete({
    where: { id: appearance.id },
  })

  return { success: true }
}
