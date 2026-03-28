import { ApiError } from '@/lib/api-errors'
import { PRIMARY_APPEARANCE_INDEX } from '@/lib/constants'
import { decodeImageUrlsFromDb } from '@/lib/contracts/image-urls-contract'
import { resolveMediaRefFromLegacyValue } from '@/lib/media/service'
import { prisma } from '@engine/prisma'

export async function listAssetHubFolders(userId: string) {
  const folders = await prisma.globalAssetFolder.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })

  return { folders }
}

export async function createAssetHubFolder(input: {
  userId: string
  name: unknown
}) {
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  if (!name) {
    throw new ApiError('INVALID_PARAMS')
  }

  const folder = await prisma.globalAssetFolder.create({
    data: {
      userId: input.userId,
      name,
    },
  })

  return { success: true, folder }
}

export async function updateAssetHubFolder(input: {
  userId: string
  folderId: string
  name: unknown
}) {
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  if (!name) {
    throw new ApiError('INVALID_PARAMS')
  }

  const folder = await prisma.globalAssetFolder.findUnique({
    where: { id: input.folderId },
  })
  if (!folder || folder.userId !== input.userId) {
    throw new ApiError('FORBIDDEN')
  }

  const updatedFolder = await prisma.globalAssetFolder.update({
    where: { id: input.folderId },
    data: { name },
  })

  return { success: true, folder: updatedFolder }
}

export async function deleteAssetHubFolder(input: {
  userId: string
  folderId: string
}) {
  const folder = await prisma.globalAssetFolder.findUnique({
    where: { id: input.folderId },
  })
  if (!folder || folder.userId !== input.userId) {
    throw new ApiError('FORBIDDEN')
  }

  await prisma.globalCharacter.updateMany({
    where: { folderId: input.folderId },
    data: { folderId: null },
  })

  await prisma.globalLocation.updateMany({
    where: { folderId: input.folderId },
    data: { folderId: null },
  })

  await prisma.globalAssetFolder.delete({
    where: { id: input.folderId },
  })

  return { success: true }
}

async function resolveCharacterPickerItems(userId: string) {
  const characters = await prisma.globalCharacter.findMany({
    where: { userId },
    include: {
      appearances: {
        orderBy: { appearanceIndex: 'asc' },
      },
      folder: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  const processedCharacters = await Promise.all(characters.map(async (character) => {
    const primaryAppearance = character.appearances.find((appearance) => appearance.appearanceIndex === PRIMARY_APPEARANCE_INDEX)
      || character.appearances[0]
    let previewUrl = null

    if (primaryAppearance) {
      const urls = decodeImageUrlsFromDb(primaryAppearance.imageUrls, 'globalCharacterAppearance.imageUrls')
      const selectedUrl = urls[primaryAppearance.selectedIndex ?? 0] || urls[0] || primaryAppearance.imageUrl
      if (selectedUrl) {
        const media = await resolveMediaRefFromLegacyValue(selectedUrl)
        previewUrl = media?.url || selectedUrl
      }
    }

    return {
      id: character.id,
      name: character.name,
      folderName: character.folder?.name || null,
      previewUrl,
      appearanceCount: character.appearances.length,
      hasVoice: !!(character.voiceId || character.customVoiceUrl),
    }
  }))

  return { characters: processedCharacters }
}

async function resolveLocationPickerItems(userId: string) {
  const locations = await prisma.globalLocation.findMany({
    where: { userId },
    include: {
      images: {
        orderBy: { imageIndex: 'asc' },
      },
      folder: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  const processedLocations = await Promise.all(locations.map(async (location) => {
    const selectedImage = location.images.find((image) => image.isSelected) || location.images[0]
    let previewUrl = null

    if (selectedImage?.imageUrl) {
      const media = await resolveMediaRefFromLegacyValue(selectedImage.imageUrl)
      previewUrl = media?.url || selectedImage.imageUrl
    }

    return {
      id: location.id,
      name: location.name,
      summary: location.summary,
      folderName: location.folder?.name || null,
      previewUrl,
      imageCount: location.images.length,
    }
  }))

  return { locations: processedLocations }
}

async function resolveVoicePickerItems(userId: string) {
  const voices = await prisma.globalVoice.findMany({
    where: { userId },
    include: {
      folder: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  const processedVoices = await Promise.all(voices.map(async (voice) => {
    let previewUrl = null
    if (voice.customVoiceUrl) {
      const media = await resolveMediaRefFromLegacyValue(voice.customVoiceUrl)
      previewUrl = media?.url || voice.customVoiceUrl
    }

    return {
      id: voice.id,
      name: voice.name,
      description: voice.description,
      folderName: voice.folder?.name || null,
      previewUrl,
      voiceId: voice.voiceId,
      voiceType: voice.voiceType,
      gender: voice.gender,
      language: voice.language,
    }
  }))

  return { voices: processedVoices }
}

export async function listAssetHubPickerItems(input: {
  userId: string
  type: string | null | undefined
}) {
  const type = input.type || 'character'

  if (type === 'character') {
    return resolveCharacterPickerItems(input.userId)
  }
  if (type === 'location') {
    return resolveLocationPickerItems(input.userId)
  }
  if (type === 'voice') {
    return resolveVoicePickerItems(input.userId)
  }

  throw new ApiError('INVALID_PARAMS')
}
