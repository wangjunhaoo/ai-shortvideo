import { prisma } from '@engine/prisma'
import { ApiError } from '@/lib/api-errors'
import { removeLocationPromptSuffix, isArtStyleValue, PRIMARY_APPEARANCE_INDEX, type ArtStyleValue } from '@/lib/constants'
import { decodeImageUrlsFromDb, encodeImageUrls } from '@/lib/contracts/image-urls-contract'
import { getBaseUrl } from '@/lib/env'
import { initializeFonts, createLabelSVG } from '@/lib/fonts'
import { normalizeImageGenerationCount } from '@/lib/image-generation/count'
import { updateCharacterAppearanceLabels, updateLocationImageLabels } from '@/lib/image-label'
import { logInfo, logError } from '@/lib/logging/core'
import { resolveStorageKeyFromMediaValue } from '@/lib/media/service'
import {
  collectBailianManagedVoiceIds,
  cleanupUnreferencedBailianVoices,
} from '@/lib/providers/bailian'
import {
  deleteObject,
  generateUniqueKey,
  getSignedUrl,
  toFetchableUrl,
  uploadObject,
} from '@/lib/storage'
import sharp from 'sharp'

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export async function createNovelPromotionCharacter(input: {
  projectId: string
  novelPromotionProjectId: string
  body: unknown
  taskLocale?: string | null
  acceptLanguage?: string
  cookieHeader?: string
}) {
  const body = toObject(input.body)
  const bodyMeta = toObject(body.meta)
  const name = normalizeString(body.name)
  const description = normalizeString(body.description)
  const referenceImageUrl = normalizeString(body.referenceImageUrl)
  const generateFromReference = body.generateFromReference === true
  const customDescription = normalizeString(body.customDescription)
  const count = generateFromReference
    ? normalizeImageGenerationCount('reference-to-character', body.count)
    : normalizeImageGenerationCount('character', body.count)
  let artStyle: ArtStyleValue | undefined
  if (Object.prototype.hasOwnProperty.call(body, 'artStyle')) {
    const parsedArtStyle = normalizeString(body.artStyle)
    if (!isArtStyleValue(parsedArtStyle)) {
      throw new ApiError('INVALID_PARAMS', {
        code: 'INVALID_ART_STYLE',
        message: 'artStyle must be a supported value',
      })
    }
    artStyle = parsedArtStyle
  }
  const resolvedArtStyle: ArtStyleValue = artStyle ?? 'american-comic'
  const referenceImageUrls = Array.isArray(body.referenceImageUrls)
    ? body.referenceImageUrls.map((item) => normalizeString(item)).filter(Boolean)
    : []

  if (!name) {
    throw new ApiError('INVALID_PARAMS')
  }

  const allReferenceImages = referenceImageUrls.length > 0
    ? referenceImageUrls.slice(0, 5)
    : referenceImageUrl
      ? [referenceImageUrl]
      : []

  const character = await prisma.novelPromotionCharacter.create({
    data: {
      novelPromotionProjectId: input.novelPromotionProjectId,
      name,
      aliases: null,
    },
  })

  const descText = description || `${name} 的角色设定`
  const appearance = await prisma.characterAppearance.create({
    data: {
      characterId: character.id,
      appearanceIndex: PRIMARY_APPEARANCE_INDEX,
      changeReason: '初始形象',
      description: descText,
      descriptions: JSON.stringify([descText]),
      imageUrls: encodeImageUrls([]),
      previousImageUrls: encodeImageUrls([]),
    },
  })

  if (generateFromReference && allReferenceImages.length > 0) {
    const baseUrl = getBaseUrl()
    fetch(`${baseUrl}/api/novel-promotion/${input.projectId}/reference-to-character`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: input.cookieHeader || '',
        ...(input.acceptLanguage ? { 'Accept-Language': input.acceptLanguage } : {}),
      },
      body: JSON.stringify({
        referenceImageUrls: allReferenceImages,
        characterName: name,
        characterId: character.id,
        appearanceId: appearance.id,
        count,
        isBackgroundJob: true,
        artStyle: resolvedArtStyle,
        customDescription: customDescription || undefined,
        locale: input.taskLocale || undefined,
        meta: {
          ...bodyMeta,
          locale: input.taskLocale || bodyMeta.locale || undefined,
        },
      }),
    }).catch((error) => {
      logError('[Character API] 参考图后台生成任务触发失败:', error)
    })
  }

  const characterWithAppearances = await prisma.novelPromotionCharacter.findUnique({
    where: { id: character.id },
    include: { appearances: true },
  })

  return { success: true, character: characterWithAppearances }
}

async function updateAssetImageLabel(imageUrl: string, newLabelText: string): Promise<string> {
  const originalKey = await resolveStorageKeyFromMediaValue(imageUrl)
  if (!originalKey) {
    throw new Error(`无法归一化媒体 key: ${imageUrl}`)
  }

  const signedUrl = getSignedUrl(originalKey, 3600)
  const response = await fetch(toFetchableUrl(signedUrl))
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const meta = await sharp(buffer).metadata()
  const width = meta.width || 2160
  const height = meta.height || 2160
  const fontSize = Math.floor(height * 0.04)
  const padding = Math.floor(fontSize * 0.5)
  const barHeight = fontSize + padding * 2

  const croppedBuffer = await sharp(buffer)
    .extract({ left: 0, top: barHeight, width, height: height - barHeight })
    .toBuffer()

  const svg = await createLabelSVG(width, barHeight, fontSize, padding, newLabelText)
  const processed = await sharp(croppedBuffer)
    .extend({
      top: barHeight,
      bottom: 0,
      left: 0,
      right: 0,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .composite([{ input: svg, top: 0, left: 0 }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer()

  const newKey = generateUniqueKey('labeled-rename', 'jpg')
  await uploadObject(processed, newKey)
  return newKey
}

async function createUploadedLabeledImage(input: {
  file: File
  labelText: string
  keyPrefix: string
}) {
  await initializeFonts()

  const buffer = Buffer.from(await input.file.arrayBuffer())
  const meta = await sharp(buffer).metadata()
  const width = meta.width || 2160
  const height = meta.height || 2160
  const fontSize = Math.floor(height * 0.04)
  const padding = Math.floor(fontSize * 0.5)
  const barHeight = fontSize + padding * 2
  const svg = await createLabelSVG(width, barHeight, fontSize, padding, input.labelText)

  const processed = await sharp(buffer)
    .extend({
      top: barHeight,
      bottom: 0,
      left: 0,
      right: 0,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .composite([{ input: svg, top: 0, left: 0 }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer()

  const key = generateUniqueKey(input.keyPrefix, 'jpg')
  await uploadObject(processed, key)
  return key
}

export async function createNovelPromotionCharacterAppearance(input: {
  projectId: string
  body: unknown
}) {
  const body = toObject(input.body)
  const characterId = normalizeString(body.characterId)
  const changeReason = normalizeString(body.changeReason)
  const description = normalizeString(body.description)

  if (!characterId || !changeReason || !description) {
    throw new ApiError('INVALID_PARAMS')
  }

  const character = await prisma.novelPromotionCharacter.findUnique({
    where: { id: characterId },
    include: {
      appearances: { orderBy: { appearanceIndex: 'asc' } },
      novelPromotionProject: true,
    },
  })

  if (!character) {
    throw new ApiError('NOT_FOUND')
  }

  if (character.novelPromotionProject.projectId !== input.projectId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const maxIndex = character.appearances.reduce(
    (max, appearance) => Math.max(max, appearance.appearanceIndex),
    0,
  )

  const appearance = await prisma.characterAppearance.create({
    data: {
      characterId,
      appearanceIndex: maxIndex + 1,
      changeReason,
      description,
      descriptions: JSON.stringify([description]),
      imageUrls: encodeImageUrls([]),
      previousImageUrls: encodeImageUrls([]),
    },
  })

  return { success: true, appearance }
}

export async function updateNovelPromotionCharacterAppearance(input: {
  projectId: string
  body: unknown
}) {
  const body = toObject(input.body)
  const characterId = normalizeString(body.characterId)
  const appearanceId = normalizeString(body.appearanceId)
  const description = normalizeString(body.description)
  const descriptionIndex = typeof body.descriptionIndex === 'number'
    ? body.descriptionIndex
    : Number.isFinite(Number(body.descriptionIndex))
      ? Number(body.descriptionIndex)
      : 0

  if (!characterId || !appearanceId || !description) {
    throw new ApiError('INVALID_PARAMS')
  }

  const appearance = await prisma.characterAppearance.findUnique({
    where: { id: appearanceId },
    include: {
      character: {
        include: { novelPromotionProject: true },
      },
    },
  })

  if (!appearance) {
    throw new ApiError('NOT_FOUND')
  }

  if (appearance.characterId !== characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (appearance.character.novelPromotionProject.projectId !== input.projectId) {
    throw new ApiError('INVALID_PARAMS')
  }

  let descriptions: string[] = []
  try {
    descriptions = appearance.descriptions ? JSON.parse(appearance.descriptions) : []
  } catch {
    descriptions = []
  }

  if (descriptionIndex >= 0 && descriptionIndex < descriptions.length) {
    descriptions[descriptionIndex] = description
  } else {
    descriptions.push(description)
  }

  await prisma.characterAppearance.update({
    where: { id: appearanceId },
    data: {
      description,
      descriptions: JSON.stringify(descriptions),
    },
  })

  return { success: true }
}

export async function deleteNovelPromotionCharacterAppearance(input: {
  characterId: string
  appearanceId: string
}) {
  if (!input.characterId || !input.appearanceId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const appearance = await prisma.characterAppearance.findUnique({
    where: { id: input.appearanceId },
    include: { character: true },
  })

  if (!appearance) {
    throw new ApiError('NOT_FOUND')
  }

  if (appearance.characterId !== input.characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const appearanceCount = await prisma.characterAppearance.count({
    where: { characterId: input.characterId },
  })

  if (appearanceCount <= 1) {
    throw new ApiError('INVALID_PARAMS')
  }

  const deletedImages: string[] = []

  if (appearance.imageUrl) {
    const key = await resolveStorageKeyFromMediaValue(appearance.imageUrl)
    if (key) {
      try {
        await deleteObject(key)
        deletedImages.push(key)
      } catch {
        // 删除形象时保持幂等，存储侧失败不阻断数据库清理
      }
    }
  }

  try {
    const urls = decodeImageUrlsFromDb(appearance.imageUrls, 'characterAppearance.imageUrls')
    for (const url of urls) {
      if (!url) continue
      const key = await resolveStorageKeyFromMediaValue(url)
      if (key && !deletedImages.includes(key)) {
        try {
          await deleteObject(key)
          deletedImages.push(key)
        } catch {
          // 删除形象时保持幂等，存储侧失败不阻断数据库清理
        }
      }
    }
  } catch {
    // contract 校验留给上游验证，删除链路保持容错
  }

  await prisma.characterAppearance.delete({
    where: { id: input.appearanceId },
  })

  const remainingAppearances = await prisma.characterAppearance.findMany({
    where: { characterId: input.characterId },
    orderBy: { appearanceIndex: 'asc' },
  })

  for (let index = 0; index < remainingAppearances.length; index += 1) {
    if (remainingAppearances[index].appearanceIndex !== index) {
      await prisma.characterAppearance.update({
        where: { id: remainingAppearances[index].id },
        data: { appearanceIndex: index },
      })
    }
  }

  return {
    success: true,
    deletedImages: deletedImages.length,
  }
}

export async function confirmNovelPromotionCharacterSelection(input: {
  characterId: string
  appearanceId: string
}) {
  if (!input.characterId || !input.appearanceId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const appearance = await prisma.characterAppearance.findUnique({
    where: { id: input.appearanceId },
    include: { character: true },
  })

  if (!appearance) {
    throw new ApiError('NOT_FOUND')
  }

  if (appearance.selectedIndex === null || appearance.selectedIndex === undefined) {
    throw new ApiError('INVALID_PARAMS')
  }

  const imageUrls = decodeImageUrlsFromDb(appearance.imageUrls, 'characterAppearance.imageUrls')
  if (imageUrls.length <= 1) {
    return {
      success: true,
      message: '已确认选择',
      deletedCount: 0,
    }
  }

  const selectedIndex = appearance.selectedIndex
  const selectedImageUrl = imageUrls[selectedIndex]
  if (!selectedImageUrl) {
    throw new ApiError('NOT_FOUND')
  }

  const deletedImages: string[] = []
  for (let index = 0; index < imageUrls.length; index += 1) {
    if (index === selectedIndex || !imageUrls[index]) continue
    const key = await resolveStorageKeyFromMediaValue(imageUrls[index])
    if (key) {
      try {
        await deleteObject(key)
        deletedImages.push(key)
      } catch {
        // 存储清理失败不阻断最终确认
      }
    }
  }

  let descriptions: string[] = []
  if (appearance.descriptions) {
    try {
      descriptions = JSON.parse(appearance.descriptions)
    } catch {
      descriptions = []
    }
  }
  const selectedDescription = descriptions[selectedIndex] || appearance.description || ''

  await prisma.characterAppearance.update({
    where: { id: appearance.id },
    data: {
      imageUrl: selectedImageUrl,
      imageUrls: encodeImageUrls([selectedImageUrl]),
      selectedIndex: 0,
      description: selectedDescription,
      descriptions: JSON.stringify([selectedDescription]),
    },
  })

  return {
    success: true,
    message: '已确认选择，其他候选图片已删除',
    deletedCount: deletedImages.length,
  }
}

export async function confirmNovelPromotionLocationSelection(locationId: string) {
  if (!locationId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const location = await prisma.novelPromotionLocation.findUnique({
    where: { id: locationId },
    include: {
      images: { orderBy: { imageIndex: 'asc' } },
    },
  })

  if (!location) {
    throw new ApiError('NOT_FOUND')
  }

  const images = location.images || []
  if (images.length <= 1) {
    return {
      success: true,
      message: '已确认选择',
      deletedCount: 0,
    }
  }

  const selectedImage = location.selectedImageId
    ? images.find((image) => image.id === location.selectedImageId)
    : images.find((image) => image.isSelected)
  if (!selectedImage) {
    throw new ApiError('INVALID_PARAMS')
  }

  const deletedImages: string[] = []
  for (const image of images) {
    if (image.id === selectedImage.id || !image.imageUrl) continue
    const key = await resolveStorageKeyFromMediaValue(image.imageUrl)
    if (key) {
      try {
        await deleteObject(key)
        deletedImages.push(key)
      } catch {
        // 存储清理失败不阻断最终确认
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.locationImage.deleteMany({
      where: {
        locationId,
        id: { not: selectedImage.id },
      },
    })

    await tx.locationImage.update({
      where: { id: selectedImage.id },
      data: { imageIndex: 0 },
    })

    await tx.novelPromotionLocation.update({
      where: { id: locationId },
      data: { selectedImageId: selectedImage.id },
    })
  })

  return {
    success: true,
    message: '已确认选择，其他候选图片已删除',
    deletedCount: deletedImages.length,
  }
}

export async function selectNovelPromotionCharacterImage(input: {
  characterId: string
  appearanceId: string
  selectedIndex: number | null
}) {
  if (!input.characterId || !input.appearanceId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const appearance = await prisma.characterAppearance.findUnique({
    where: { id: input.appearanceId },
    include: { character: true },
  })

  if (!appearance) {
    throw new ApiError('NOT_FOUND')
  }

  const imageUrls = decodeImageUrlsFromDb(appearance.imageUrls, 'characterAppearance.imageUrls')
  if (input.selectedIndex !== null) {
    if (
      input.selectedIndex < 0
      || input.selectedIndex >= imageUrls.length
      || !imageUrls[input.selectedIndex]
    ) {
      throw new ApiError('INVALID_PARAMS')
    }
  }

  const selectedImageKey = input.selectedIndex !== null ? imageUrls[input.selectedIndex] : null

  await prisma.characterAppearance.update({
    where: { id: appearance.id },
    data: {
      selectedIndex: input.selectedIndex,
      imageUrl: selectedImageKey,
    },
  })

  return {
    success: true,
    selectedIndex: input.selectedIndex,
    imageUrl: selectedImageKey ? getSignedUrl(selectedImageKey, 7 * 24 * 3600) : null,
  }
}

export async function selectNovelPromotionLocationImage(input: {
  locationId: string
  selectedIndex: number | null
}) {
  if (!input.locationId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const location = await prisma.novelPromotionLocation.findUnique({
    where: { id: input.locationId },
    include: {
      images: { orderBy: { imageIndex: 'asc' } },
    },
  })

  if (!location) {
    throw new ApiError('NOT_FOUND')
  }

  if (input.selectedIndex !== null) {
    const targetImage = location.images.find((image) => image.imageIndex === input.selectedIndex)
    if (!targetImage || !targetImage.imageUrl) {
      throw new ApiError('INVALID_PARAMS')
    }
  }

  await prisma.locationImage.updateMany({
    where: { locationId: input.locationId },
    data: { isSelected: false },
  })

  let signedUrl: string | null = null
  if (input.selectedIndex !== null) {
    const updated = await prisma.locationImage.update({
      where: {
        locationId_imageIndex: {
          locationId: input.locationId,
          imageIndex: input.selectedIndex,
        },
      },
      data: { isSelected: true },
    })
    signedUrl = updated.imageUrl ? getSignedUrl(updated.imageUrl, 7 * 24 * 3600) : null

    await prisma.novelPromotionLocation.update({
      where: { id: input.locationId },
      data: { selectedImageId: updated.id },
    })
  } else {
    await prisma.novelPromotionLocation.update({
      where: { id: input.locationId },
      data: { selectedImageId: null },
    })
  }

  return {
    success: true,
    selectedIndex: input.selectedIndex,
    imageUrl: signedUrl,
  }
}

export async function cleanupNovelPromotionUnselectedImages(novelPromotionProjectId: string) {
  let deletedCount = 0

  const appearances = await prisma.characterAppearance.findMany({
    where: {
      character: { novelPromotionProjectId },
    },
    include: { character: true },
  })

  for (const appearance of appearances) {
    if (appearance.selectedIndex === null) continue

    try {
      const imageUrls = decodeImageUrlsFromDb(appearance.imageUrls, 'characterAppearance.imageUrls')
      if (imageUrls.length <= 1) continue

      for (let index = 0; index < imageUrls.length; index += 1) {
        if (index === appearance.selectedIndex || !imageUrls[index]) continue
        try {
          const key = await resolveStorageKeyFromMediaValue(imageUrls[index])
          if (key) {
            await deleteObject(key)
            deletedCount += 1
          }
        } catch {
          // 清理阶段允许单张失败，不阻断整体推进
        }
      }

      const selectedUrl = imageUrls[appearance.selectedIndex]
      if (!selectedUrl) continue

      await prisma.characterAppearance.update({
        where: { id: appearance.id },
        data: {
          imageUrls: encodeImageUrls([selectedUrl]),
          selectedIndex: 0,
        },
      })
    } catch {
      // 合同异常由上游验证兜底，这里保持批量清理的容错性
    }
  }

  const locations = await prisma.novelPromotionLocation.findMany({
    where: { novelPromotionProjectId },
    include: { images: true },
  })

  for (const location of locations) {
    const selectedImage = location.selectedImageId
      ? location.images.find((image) => image.id === location.selectedImageId)
      : location.images.find((image) => image.isSelected)
    if (!selectedImage) continue

    for (const image of location.images) {
      if (image.id === selectedImage.id) continue

      if (image.imageUrl) {
        try {
          const key = await resolveStorageKeyFromMediaValue(image.imageUrl)
          if (key) {
            await deleteObject(key)
            deletedCount += 1
          }
        } catch {
          // 清理阶段允许单张失败，不阻断整体推进
        }
      }

      await prisma.locationImage.delete({
        where: { id: image.id },
      })
    }

    await prisma.locationImage.update({
      where: { id: selectedImage.id },
      data: { imageIndex: 0 },
    })

    await prisma.novelPromotionLocation.update({
      where: { id: location.id },
      data: { selectedImageId: selectedImage.id },
    })
  }

  return { success: true, deletedCount }
}

export async function updateNovelPromotionAssetLabel(input: {
  type: string
  id: string
  newName: string
  appearanceIndex?: number
}) {
  await initializeFonts()

  if (!input.type || !input.id || !input.newName) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (input.type === 'character') {
    const character = await prisma.novelPromotionCharacter.findUnique({
      where: { id: input.id },
      include: { appearances: true },
    })

    if (!character) {
      throw new ApiError('NOT_FOUND')
    }

    const results = await Promise.all(character.appearances.map(async (appearance) => {
      if (
        input.appearanceIndex !== undefined
        && appearance.appearanceIndex !== input.appearanceIndex
      ) {
        return null
      }

      let imageUrls = decodeImageUrlsFromDb(appearance.imageUrls, 'characterAppearance.imageUrls')
      if (imageUrls.length === 0 && appearance.imageUrl) {
        imageUrls = [appearance.imageUrl]
      }
      if (imageUrls.length === 0) return null

      const newLabelText = `${input.newName} - ${appearance.changeReason}`
      const newImageUrls = await Promise.all(imageUrls.map(async (url) => {
        if (!url) return ''
        try {
          return await updateAssetImageLabel(url, newLabelText)
        } catch {
          return url
        }
      }))

      const firstUrl = newImageUrls.find((url) => !!url) || null
      await prisma.characterAppearance.update({
        where: { id: appearance.id },
        data: {
          imageUrls: encodeImageUrls(newImageUrls),
          imageUrl: firstUrl,
        },
      })

      return {
        appearanceIndex: appearance.appearanceIndex,
        imageUrls: newImageUrls,
      }
    }))

    return { success: true, results: results.filter((item) => item !== null) }
  }

  if (input.type === 'location') {
    const location = await prisma.novelPromotionLocation.findUnique({
      where: { id: input.id },
      include: { images: true },
    })

    if (!location) {
      throw new ApiError('NOT_FOUND')
    }

    const results = await Promise.all(location.images.map(async (image) => {
      if (!image.imageUrl) return null

      try {
        const newImageUrl = await updateAssetImageLabel(image.imageUrl, input.newName)
        await prisma.locationImage.update({
          where: { id: image.id },
          data: { imageUrl: newImageUrl },
        })
        return { imageIndex: image.imageIndex, imageUrl: newImageUrl }
      } catch {
        return null
      }
    }))

    return { success: true, results: results.filter((item) => item !== null) }
  }

  throw new ApiError('INVALID_PARAMS')
}

export async function uploadNovelPromotionAssetImage(input: {
  file: File
  type: string
  id: string
  appearanceId?: string | null
  imageIndex?: number | null
  labelText: string
}) {
  if (!input.file || !input.type || !input.id || !input.labelText) {
    throw new ApiError('INVALID_PARAMS')
  }

  const keyPrefix = input.type === 'character'
    ? `char-${input.id}-${input.appearanceId}-upload`
    : `loc-${input.id}-upload`
  const key = await createUploadedLabeledImage({
    file: input.file,
    labelText: input.labelText,
    keyPrefix,
  })

  if (input.type === 'character' && input.appearanceId) {
    const appearance = await prisma.characterAppearance.findUnique({
      where: { id: input.appearanceId },
    })

    if (!appearance) {
      throw new ApiError('NOT_FOUND')
    }

    const imageUrls = decodeImageUrlsFromDb(appearance.imageUrls, 'characterAppearance.imageUrls')
    const targetIndex = input.imageIndex ?? imageUrls.length

    while (imageUrls.length <= targetIndex) {
      imageUrls.push('')
    }
    imageUrls[targetIndex] = key

    const selectedIndex = appearance.selectedIndex
    const shouldUpdateImageUrl = selectedIndex === targetIndex
      || (selectedIndex === null && targetIndex === 0)
      || imageUrls.filter((url) => !!url).length === 1

    const updateData: Record<string, unknown> = {
      imageUrls: encodeImageUrls(imageUrls),
    }
    if (shouldUpdateImageUrl) {
      updateData.imageUrl = key
    }

    await prisma.characterAppearance.update({
      where: { id: appearance.id },
      data: updateData,
    })

    return {
      success: true,
      imageKey: key,
      imageIndex: targetIndex,
    }
  }

  if (input.type === 'location') {
    const location = await prisma.novelPromotionLocation.findUnique({
      where: { id: input.id },
      include: { images: { orderBy: { imageIndex: 'asc' } } },
    })

    if (!location) {
      throw new ApiError('NOT_FOUND')
    }

    if (input.imageIndex !== null && input.imageIndex !== undefined) {
      const existingImage = location.images.find((image) => image.imageIndex === input.imageIndex)
      if (existingImage) {
        const updated = await prisma.locationImage.update({
          where: { id: existingImage.id },
          data: { imageUrl: key },
        })
        if (!location.selectedImageId) {
          await prisma.novelPromotionLocation.update({
            where: { id: input.id },
            data: { selectedImageId: updated.id },
          })
        }
      } else {
        const created = await prisma.locationImage.create({
          data: {
            locationId: input.id,
            imageIndex: input.imageIndex,
            imageUrl: key,
            description: input.labelText,
            isSelected: input.imageIndex === 0,
          },
        })
        if (!location.selectedImageId) {
          await prisma.novelPromotionLocation.update({
            where: { id: input.id },
            data: { selectedImageId: created.id },
          })
        }
      }

      return {
        success: true,
        imageKey: key,
        imageIndex: input.imageIndex,
      }
    }

    const nextIndex = location.images.length
    const created = await prisma.locationImage.create({
      data: {
        locationId: input.id,
        imageIndex: nextIndex,
        imageUrl: key,
        description: input.labelText,
        isSelected: nextIndex === 0,
      },
    })
    if (!location.selectedImageId) {
      await prisma.novelPromotionLocation.update({
        where: { id: input.id },
        data: { selectedImageId: created.id },
      })
    }

    return {
      success: true,
      imageKey: key,
      imageIndex: nextIndex,
    }
  }

  throw new ApiError('INVALID_PARAMS')
}

export async function copyNovelPromotionAssetFromGlobal(input: {
  userId: string
  type: string
  targetId: string
  globalAssetId: string
}) {
  if (!input.type || !input.targetId || !input.globalAssetId) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (input.type === 'character') {
    return await copyCharacterFromGlobal(input.userId, input.targetId, input.globalAssetId)
  }
  if (input.type === 'location') {
    return await copyLocationFromGlobal(input.userId, input.targetId, input.globalAssetId)
  }
  if (input.type === 'voice') {
    return await copyVoiceFromGlobal(input.userId, input.targetId, input.globalAssetId)
  }

  throw new ApiError('INVALID_PARAMS')
}

export async function updateNovelPromotionCharacter(input: {
  characterId: string
  name?: unknown
  introduction?: unknown
}) {
  if (!input.characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const hasName = input.name !== undefined
  const hasIntroduction = input.introduction !== undefined
  if (!hasName && !hasIntroduction) {
    throw new ApiError('INVALID_PARAMS')
  }

  const updateData: { name?: string; introduction?: string } = {}
  if (hasName && typeof input.name === 'string') updateData.name = input.name.trim()
  if (hasIntroduction && typeof input.introduction === 'string') updateData.introduction = input.introduction.trim()

  const character = await prisma.novelPromotionCharacter.update({
    where: { id: input.characterId },
    data: updateData,
  })

  return { success: true, character }
}

export async function deleteNovelPromotionCharacter(input: {
  projectId: string
  userId: string
  characterId: string
}) {
  if (!input.characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const character = await prisma.novelPromotionCharacter.findFirst({
    where: {
      id: input.characterId,
      novelPromotionProject: { projectId: input.projectId },
    },
    select: {
      id: true,
      voiceId: true,
      voiceType: true,
    },
  })
  if (!character) {
    throw new ApiError('NOT_FOUND')
  }

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
      excludeNovelCharacterId: character.id,
    },
  })

  await prisma.novelPromotionCharacter.delete({
    where: { id: input.characterId },
  })

  return { success: true }
}

export async function createNovelPromotionLocation(input: {
  novelPromotionProjectId: string
  body: unknown
}) {
  const body = toObject(input.body)
  const name = normalizeString(body.name)
  const description = normalizeString(body.description)
  const summary = normalizeString(body.summary)
  const count = Object.prototype.hasOwnProperty.call(body, 'count')
    ? normalizeImageGenerationCount('location', body.count)
    : 1

  let artStyle: ArtStyleValue | undefined
  if (Object.prototype.hasOwnProperty.call(body, 'artStyle')) {
    const parsedArtStyle = normalizeString(body.artStyle)
    if (!isArtStyleValue(parsedArtStyle)) {
      throw new ApiError('INVALID_PARAMS', {
        code: 'INVALID_ART_STYLE',
        message: 'artStyle must be a supported value',
      })
    }
    artStyle = parsedArtStyle
  }
  void artStyle

  if (!name || !description) {
    throw new ApiError('INVALID_PARAMS')
  }

  const cleanDescription = removeLocationPromptSuffix(description)
  const location = await prisma.novelPromotionLocation.create({
    data: {
      novelPromotionProjectId: input.novelPromotionProjectId,
      name,
      summary: summary || null,
    },
  })

  await prisma.locationImage.createMany({
    data: Array.from({ length: count }, (_value, imageIndex) => ({
      locationId: location.id,
      imageIndex,
      description: cleanDescription,
    })),
  })

  const locationWithImages = await prisma.novelPromotionLocation.findUnique({
    where: { id: location.id },
    include: { images: true },
  })

  return { success: true, location: locationWithImages }
}

export async function updateNovelPromotionLocation(input: {
  body: Record<string, unknown>
}) {
  const { locationId, imageIndex, description, name } = input.body

  if (!locationId || typeof locationId !== 'string') {
    throw new ApiError('INVALID_PARAMS')
  }

  if (name !== undefined || input.body.summary !== undefined) {
    const updateData: { name?: string; summary?: string | null } = {}
    if (name !== undefined) updateData.name = typeof name === 'string' ? name.trim() : ''
    if (input.body.summary !== undefined) {
      updateData.summary = typeof input.body.summary === 'string'
        ? input.body.summary.trim() || null
        : null
    }

    const location = await prisma.novelPromotionLocation.update({
      where: { id: locationId },
      data: updateData,
    })
    return { success: true, location }
  }

  if (imageIndex !== undefined && typeof description === 'string' && description.trim()) {
    const cleanDescription = removeLocationPromptSuffix(description.trim())
    const image = await prisma.locationImage.update({
      where: {
        locationId_imageIndex: { locationId, imageIndex: Number(imageIndex) },
      },
      data: { description: cleanDescription },
    })
    return { success: true, image }
  }

  throw new ApiError('INVALID_PARAMS')
}

export async function deleteNovelPromotionLocation(locationId: string) {
  if (!locationId) {
    throw new ApiError('INVALID_PARAMS')
  }

  await prisma.novelPromotionLocation.delete({
    where: { id: locationId },
  })

  return { success: true }
}

async function copyCharacterFromGlobal(userId: string, targetId: string, globalCharacterId: string) {
  logInfo(`[Copy from Global] 复制角色: global=${globalCharacterId} -> project=${targetId}`)

  const globalCharacter = await prisma.globalCharacter.findFirst({
    where: { id: globalCharacterId, userId },
    include: { appearances: true },
  })
  if (!globalCharacter) {
    throw new ApiError('NOT_FOUND')
  }

  const projectCharacter = await prisma.novelPromotionCharacter.findUnique({
    where: { id: targetId },
    include: { appearances: true },
  })
  if (!projectCharacter) {
    throw new ApiError('NOT_FOUND')
  }

  if (projectCharacter.appearances.length > 0) {
    await prisma.characterAppearance.deleteMany({
      where: { characterId: targetId },
    })
    logInfo(`[Copy from Global] 删除了 ${projectCharacter.appearances.length} 个旧形象`)
  }

  logInfo(`[Copy from Global] 更新黑边标签: ${globalCharacter.name} -> ${projectCharacter.name}`)
  const updatedLabels = await updateCharacterAppearanceLabels(
    globalCharacter.appearances.map((appearance) => ({
      imageUrl: appearance.imageUrl,
      imageUrls: encodeImageUrls(
        decodeImageUrlsFromDb(appearance.imageUrls, 'globalCharacterAppearance.imageUrls'),
      ),
      changeReason: appearance.changeReason,
    })),
    projectCharacter.name,
  )

  const copiedAppearances = []
  for (let index = 0; index < globalCharacter.appearances.length; index += 1) {
    const appearance = globalCharacter.appearances[index]
    const labelUpdate = updatedLabels[index]
    const originalImageUrls = decodeImageUrlsFromDb(appearance.imageUrls, 'globalCharacterAppearance.imageUrls')

    const newAppearance = await prisma.characterAppearance.create({
      data: {
        characterId: targetId,
        appearanceIndex: appearance.appearanceIndex,
        changeReason: appearance.changeReason,
        description: appearance.description,
        descriptions: appearance.descriptions,
        imageUrl: labelUpdate?.imageUrl || appearance.imageUrl,
        imageUrls: labelUpdate?.imageUrls || encodeImageUrls(originalImageUrls),
        previousImageUrls: encodeImageUrls([]),
        selectedIndex: appearance.selectedIndex,
      },
    })
    copiedAppearances.push(newAppearance)
  }
  logInfo(`[Copy from Global] 复制了 ${copiedAppearances.length} 个形象（已更新标签）`)

  const updatedCharacter = await prisma.novelPromotionCharacter.update({
    where: { id: targetId },
    data: {
      sourceGlobalCharacterId: globalCharacterId,
      profileConfirmed: true,
      voiceId: globalCharacter.voiceId,
      voiceType: globalCharacter.voiceType,
      customVoiceUrl: globalCharacter.customVoiceUrl,
    },
    include: { appearances: true },
  })

  logInfo(`[Copy from Global] 角色复制完成: ${projectCharacter.name}`)

  return {
    success: true,
    character: updatedCharacter,
    copiedAppearancesCount: copiedAppearances.length,
  }
}

async function copyLocationFromGlobal(userId: string, targetId: string, globalLocationId: string) {
  logInfo(`[Copy from Global] 复制场景: global=${globalLocationId} -> project=${targetId}`)

  const globalLocation = await prisma.globalLocation.findFirst({
    where: { id: globalLocationId, userId },
    include: { images: true },
  })
  if (!globalLocation) {
    throw new ApiError('NOT_FOUND')
  }

  const projectLocation = await prisma.novelPromotionLocation.findUnique({
    where: { id: targetId },
    include: { images: true },
  })
  if (!projectLocation) {
    throw new ApiError('NOT_FOUND')
  }

  if (projectLocation.images.length > 0) {
    await prisma.locationImage.deleteMany({
      where: { locationId: targetId },
    })
    logInfo(`[Copy from Global] 删除了 ${projectLocation.images.length} 个旧图片`)
  }

  logInfo(`[Copy from Global] 更新黑边标签: ${globalLocation.name} -> ${projectLocation.name}`)
  const updatedLabels = await updateLocationImageLabels(
    globalLocation.images.map((image) => ({
      imageUrl: image.imageUrl,
    })),
    projectLocation.name,
  )

  const copiedImages: Array<{ id: string; imageIndex: number; imageUrl: string | null }> = []
  for (let index = 0; index < globalLocation.images.length; index += 1) {
    const image = globalLocation.images[index]
    const labelUpdate = updatedLabels[index]

    const newImage = await prisma.locationImage.create({
      data: {
        locationId: targetId,
        imageIndex: image.imageIndex,
        description: image.description,
        imageUrl: labelUpdate?.imageUrl || image.imageUrl,
        isSelected: image.isSelected,
      },
    })
    copiedImages.push(newImage)
  }
  logInfo(`[Copy from Global] 复制了 ${copiedImages.length} 个图片（已更新标签）`)

  const selectedFromGlobal = globalLocation.images.find((image) => image.isSelected)
  const selectedImageId = selectedFromGlobal
    ? copiedImages.find((image) => image.imageIndex === selectedFromGlobal.imageIndex)?.id || null
    : copiedImages.find((image) => image.imageUrl)?.id || null

  await prisma.novelPromotionLocation.update({
    where: { id: targetId },
    data: { selectedImageId },
  })

  const updatedLocation = await prisma.novelPromotionLocation.update({
    where: { id: targetId },
    data: {
      sourceGlobalLocationId: globalLocationId,
      summary: globalLocation.summary,
    },
    include: { images: true },
  })

  logInfo(`[Copy from Global] 场景复制完成: ${projectLocation.name}`)

  return {
    success: true,
    location: updatedLocation,
    copiedImagesCount: copiedImages.length,
  }
}

async function copyVoiceFromGlobal(userId: string, targetCharacterId: string, globalVoiceId: string) {
  logInfo(`[Copy from Global] 复制音色: global=${globalVoiceId} -> project character=${targetCharacterId}`)

  const globalVoice = await prisma.globalVoice.findFirst({
    where: { id: globalVoiceId, userId },
  })
  if (!globalVoice) {
    throw new ApiError('NOT_FOUND')
  }

  const projectCharacter = await prisma.novelPromotionCharacter.findUnique({
    where: { id: targetCharacterId },
  })
  if (!projectCharacter) {
    throw new ApiError('NOT_FOUND')
  }

  const updatedCharacter = await prisma.novelPromotionCharacter.update({
    where: { id: targetCharacterId },
    data: {
      voiceId: globalVoice.voiceId,
      voiceType: globalVoice.voiceType,
      customVoiceUrl: globalVoice.customVoiceUrl,
    },
  })

  logInfo(`[Copy from Global] 音色复制完成: ${projectCharacter.name} <- ${globalVoice.name}`)

  return {
    success: true,
    character: updatedCharacter,
    voiceName: globalVoice.name,
  }
}
