import { logError as _ulogError, logWarn as _ulogWarn } from '@/lib/logging/core'
import { ApiError } from '@/lib/api-errors'
import { PRIMARY_APPEARANCE_INDEX } from '@/lib/constants'
import { decodeImageUrlsFromDb, encodeImageUrls } from '@/lib/contracts/image-urls-contract'
import { initializeFonts, createLabelSVG } from '@/lib/fonts'
import { resolveStorageKeyFromMediaValue } from '@/lib/media/service'
import { deleteObject, generateUniqueKey, getSignedUrl, toFetchableUrl, uploadObject } from '@/lib/storage'
import { prisma } from '@engine/prisma'
import sharp from 'sharp'

export async function selectAssetHubImage(input: {
  userId: string
  body: unknown
}) {
  const body = (input.body && typeof input.body === 'object' && !Array.isArray(input.body))
    ? input.body as {
      type?: 'character' | 'location'
      id?: string
      appearanceIndex?: number
      imageIndex?: number
      confirm?: boolean
    }
    : {}
  const { type, id, appearanceIndex, imageIndex, confirm } = body

  if (type === 'character') {
    const appearance = await prisma.globalCharacterAppearance.findFirst({
      where: {
        characterId: id,
        appearanceIndex: appearanceIndex ?? PRIMARY_APPEARANCE_INDEX,
        character: { userId: input.userId },
      },
    })

    if (!appearance) {
      throw new ApiError('NOT_FOUND')
    }

    if (confirm && appearance.selectedIndex !== null) {
      const imageUrls = decodeImageUrlsFromDb(appearance.imageUrls, 'globalCharacterAppearance.imageUrls')
      const selectedUrl = imageUrls[appearance.selectedIndex]

      if (!selectedUrl) {
        throw new ApiError('NOT_FOUND')
      }

      for (let i = 0; i < imageUrls.length; i += 1) {
        if (i !== appearance.selectedIndex && imageUrls[i]) {
          const key = await resolveStorageKeyFromMediaValue(imageUrls[i]!)
          if (key) {
            try {
              await deleteObject(key)
            } catch {
              _ulogWarn('Failed to delete image:', key)
            }
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
      const selectedDescription = descriptions[appearance.selectedIndex] || appearance.description || ''

      await prisma.globalCharacterAppearance.update({
        where: { id: appearance.id },
        data: {
          imageUrl: selectedUrl,
          imageUrls: encodeImageUrls([selectedUrl]),
          selectedIndex: 0,
          description: selectedDescription,
          descriptions: JSON.stringify([selectedDescription]),
        },
      })
    } else {
      await prisma.globalCharacterAppearance.update({
        where: { id: appearance.id },
        data: { selectedIndex: imageIndex },
      })
    }

    return { success: true }
  }

  if (type === 'location') {
    const location = await prisma.globalLocation.findFirst({
      where: { id, userId: input.userId },
      include: { images: { orderBy: { imageIndex: 'asc' } } },
    })

    if (!location) {
      throw new ApiError('NOT_FOUND')
    }

    const images = location.images || []
    const selectedImage = images.find((image) => image.isSelected)
    const confirmIndex = imageIndex ?? selectedImage?.imageIndex

    if (confirm && confirmIndex !== null && confirmIndex !== undefined) {
      const targetImage = images.find((image) => image.imageIndex === confirmIndex)
      if (!targetImage) {
        throw new ApiError('NOT_FOUND')
      }

      const imagesToDelete = images.filter((image) => image.id !== targetImage.id)
      for (const image of imagesToDelete) {
        if (image.imageUrl) {
          const key = await resolveStorageKeyFromMediaValue(image.imageUrl)
          if (key) {
            try {
              await deleteObject(key)
            } catch {
              _ulogWarn('Failed to delete image:', key)
            }
          }
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.globalLocationImage.deleteMany({
          where: { locationId: id!, id: { not: targetImage.id } },
        })
        await tx.globalLocationImage.update({
          where: { id: targetImage.id },
          data: { imageIndex: 0, isSelected: true },
        })
      })
    } else {
      await prisma.globalLocationImage.updateMany({
        where: { locationId: id },
        data: { isSelected: false },
      })

      if (imageIndex !== null && imageIndex !== undefined) {
        const targetImage = images.find((image) => image.imageIndex === imageIndex)
        if (targetImage) {
          await prisma.globalLocationImage.update({
            where: { id: targetImage.id },
            data: { isSelected: true },
          })
        }
      }
    }

    return { success: true }
  }

  throw new ApiError('INVALID_PARAMS')
}

async function updateImageLabel(imageUrl: string, newLabelText: string): Promise<string> {
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
    .extend({ top: barHeight, bottom: 0, left: 0, right: 0, background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .composite([{ input: svg, top: 0, left: 0 }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer()

  const newKey = generateUniqueKey('labeled-rename', 'jpg')
  await uploadObject(processed, newKey)
  return newKey
}

export async function updateAssetHubLabel(input: {
  userId: string
  body: unknown
}) {
  await initializeFonts()

  const body = (input.body && typeof input.body === 'object' && !Array.isArray(input.body))
    ? input.body as {
      type?: string
      id?: string
      newName?: string
      appearanceIndex?: number
    }
    : {}
  const { type, id, newName, appearanceIndex } = body

  if (!type || !id || !newName) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (type === 'character') {
    const character = await prisma.globalCharacter.findUnique({
      where: { id },
      include: { appearances: true },
    })

    if (!character || character.userId !== input.userId) {
      throw new ApiError('NOT_FOUND')
    }

    const results = await Promise.all(character.appearances.map(async (appearance) => {
      if (appearanceIndex !== undefined && appearance.appearanceIndex !== appearanceIndex) {
        return null
      }

      let imageUrls = decodeImageUrlsFromDb(appearance.imageUrls, 'globalCharacterAppearance.imageUrls')
      if (imageUrls.length === 0 && appearance.imageUrl) {
        imageUrls = [appearance.imageUrl]
      }
      if (imageUrls.length === 0) return null

      const newLabelText = `${newName} - ${appearance.changeReason}`
      const newImageUrls: string[] = await Promise.all(imageUrls.map(async (url, index) => {
        if (!url) return ''
        try {
          return await updateImageLabel(url, newLabelText)
        } catch (error) {
          _ulogError(`Failed to update label for global character image ${index}:`, error)
          return url
        }
      }))

      const firstUrl = newImageUrls.find((url) => !!url) || null
      await prisma.globalCharacterAppearance.update({
        where: { id: appearance.id },
        data: {
          imageUrls: encodeImageUrls(newImageUrls),
          imageUrl: firstUrl,
        },
      })

      return { appearanceIndex: appearance.appearanceIndex, imageUrls: newImageUrls }
    }))

    return { success: true, results: results.filter((item) => item !== null) }
  }

  if (type === 'location') {
    const location = await prisma.globalLocation.findUnique({
      where: { id },
      include: { images: true },
    })

    if (!location || location.userId !== input.userId) {
      throw new ApiError('NOT_FOUND')
    }

    const results = await Promise.all(location.images.map(async (image) => {
      if (!image.imageUrl) return null
      try {
        const newImageUrl = await updateImageLabel(image.imageUrl, newName)
        await prisma.globalLocationImage.update({
          where: { id: image.id },
          data: { imageUrl: newImageUrl },
        })
        return { imageIndex: image.imageIndex, imageUrl: newImageUrl }
      } catch (error) {
        _ulogError(`Failed to update label for global location image ${image.imageIndex}:`, error)
        return null
      }
    }))

    return { success: true, results: results.filter((item) => item !== null) }
  }

  throw new ApiError('INVALID_PARAMS')
}
