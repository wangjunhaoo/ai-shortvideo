import sharp from 'sharp'
import { ApiError } from '@/lib/api-errors'
import { PRIMARY_APPEARANCE_INDEX } from '@/lib/constants'
import { decodeImageUrlsFromDb, encodeImageUrls } from '@/lib/contracts/image-urls-contract'
import { createLabelSVG, initializeFonts } from '@/lib/fonts'
import { normalizeImageGenerationCount } from '@/lib/image-generation/count'
import { maybeSubmitLLMTask } from '@/lib/llm-observe/route-task'
import { generateUniqueKey, getSignedUrl, uploadObject } from '@/lib/storage'
import { TASK_TYPE } from '@/lib/task/types'
import { isErrorResponse, requireUserAuth } from '@engine/api-auth'
import { prisma } from '@engine/prisma'

function parseReferenceImages(body: Record<string, unknown>): string[] {
  const list = Array.isArray(body.referenceImageUrls)
    ? body.referenceImageUrls
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    : []
  if (list.length > 0) return list.slice(0, 5)
  const single = typeof body.referenceImageUrl === 'string' ? body.referenceImageUrl.trim() : ''
  return single ? [single] : []
}

async function requireAssetHubUserSession() {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  return authResult.session
}

function readRequiredCharacterId(body: Record<string, unknown>) {
  const characterId = typeof body.characterId === 'string' ? body.characterId : ''
  if (!characterId) {
    throw new ApiError('INVALID_PARAMS')
  }
  return characterId
}

function readVoiceDesignPayload(body: Record<string, unknown>) {
  const nested = body.voiceDesign && typeof body.voiceDesign === 'object'
    ? (body.voiceDesign as Record<string, unknown>)
    : body
  const voiceId = typeof nested.voiceId === 'string' ? nested.voiceId : ''
  const audioBase64 = typeof nested.audioBase64 === 'string' ? nested.audioBase64 : ''
  if (!voiceId || !audioBase64) {
    throw new ApiError('INVALID_PARAMS')
  }
  return { voiceId, audioBase64 }
}

async function ensureOwnedGlobalCharacter(userId: string, characterId: string) {
  const character = await prisma.globalCharacter.findFirst({
    where: { id: characterId, userId },
  })
  if (!character) {
    throw new ApiError('NOT_FOUND')
  }
  return character
}

export async function handleUploadAssetHubTempRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : ''
  const base64 = typeof body.base64 === 'string' ? body.base64 : ''
  const extension = typeof body.extension === 'string' ? body.extension : ''

  let buffer: Buffer
  let ext: string

  if (imageBase64) {
    const matches = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      throw new ApiError('INVALID_PARAMS')
    }
    ext = matches[1] === 'jpeg' ? 'jpg' : matches[1]
    buffer = Buffer.from(matches[2], 'base64')
  } else if (base64 && extension) {
    buffer = Buffer.from(base64, 'base64')
    ext = extension
  } else {
    throw new ApiError('INVALID_PARAMS')
  }

  const key = generateUniqueKey(`temp-${session.user.id}-${Date.now()}`, ext)
  await uploadObject(buffer, key)
  const signedUrl = getSignedUrl(key, 3600)

  return Response.json({
    success: true,
    url: signedUrl,
    key,
  })
}

export async function handleReferenceToAssetHubCharacterRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const referenceImages = parseReferenceImages(body)
  if (referenceImages.length === 0) {
    throw new ApiError('INVALID_PARAMS')
  }

  const count = normalizeImageGenerationCount('reference-to-character', body.count)
  body.count = count

  const isBackgroundJob =
    body.isBackgroundJob === true || body.isBackgroundJob === 1 || body.isBackgroundJob === '1'
  const characterId = typeof body.characterId === 'string' ? body.characterId : ''
  const appearanceId = typeof body.appearanceId === 'string' ? body.appearanceId : ''
  if (isBackgroundJob && (!characterId || !appearanceId)) {
    throw new ApiError('INVALID_PARAMS')
  }

  const asyncTaskResponse = await maybeSubmitLLMTask({
    request,
    userId: session.user.id,
    projectId: 'global-asset-hub',
    type: TASK_TYPE.ASSET_HUB_REFERENCE_TO_CHARACTER,
    targetType: appearanceId ? 'GlobalCharacterAppearance' : 'GlobalCharacter',
    targetId: appearanceId || characterId || session.user.id,
    routePath: '/api/asset-hub/reference-to-character',
    body,
    dedupeKey: `asset_hub_reference_to_character:${appearanceId || characterId || session.user.id}:${count}`,
  })
  if (asyncTaskResponse) return asyncTaskResponse

  throw new ApiError('INVALID_PARAMS')
}

export async function handleSaveAssetHubCharacterVoiceRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const characterId = readRequiredCharacterId(body)
    const { voiceId, audioBase64 } = readVoiceDesignPayload(body)
    await ensureOwnedGlobalCharacter(session.user.id, characterId)

    const audioBuffer = Buffer.from(audioBase64, 'base64')
    const key = generateUniqueKey(`global-voice/${session.user.id}/${characterId}`, 'wav')
    const cosUrl = await uploadObject(audioBuffer, key)

    await prisma.globalCharacter.update({
      where: { id: characterId },
      data: {
        voiceType: 'qwen-designed',
        voiceId,
        customVoiceUrl: cosUrl,
      },
    })

    return Response.json({
      success: true,
      audioUrl: getSignedUrl(cosUrl, 7200),
    })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const characterId = formData.get('characterId')
  if (!(file instanceof File) || typeof characterId !== 'string' || !characterId) {
    throw new ApiError('INVALID_PARAMS')
  }

  await ensureOwnedGlobalCharacter(session.user.id, characterId)

  const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a']
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
    throw new ApiError('INVALID_PARAMS')
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3'
  const key = generateUniqueKey(`global-voice/${session.user.id}/${characterId}`, ext)
  const audioUrl = await uploadObject(buffer, key)

  await prisma.globalCharacter.update({
    where: { id: characterId },
    data: {
      voiceType: 'uploaded',
      voiceId: null,
      customVoiceUrl: audioUrl,
    },
  })

  return Response.json({
    success: true,
    audioUrl: getSignedUrl(audioUrl, 7200),
  })
}

export async function handleUpdateAssetHubCharacterVoiceRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const characterId = readRequiredCharacterId(body)
  await ensureOwnedGlobalCharacter(session.user.id, characterId)

  const voiceType = typeof body.voiceType === 'string' ? body.voiceType : null
  const voiceId = typeof body.voiceId === 'string' ? body.voiceId : null
  const customVoiceUrl = typeof body.customVoiceUrl === 'string' ? body.customVoiceUrl : null

  await prisma.globalCharacter.update({
    where: { id: characterId },
    data: {
      voiceType,
      voiceId,
      customVoiceUrl,
    },
  })

  return Response.json({ success: true })
}

export async function handleUploadAssetHubImageRequest(request: Request) {
  await initializeFonts()
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const formData = await request.formData()
  const file = formData.get('file')
  const type = formData.get('type')
  const id = formData.get('id')
  const labelText = formData.get('labelText')
  const appearanceIndex = formData.get('appearanceIndex')
  const imageIndex = formData.get('imageIndex')

  if (!(file instanceof File) || typeof type !== 'string' || typeof id !== 'string' || typeof labelText !== 'string') {
    throw new ApiError('INVALID_PARAMS')
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const meta = await sharp(buffer).metadata()
  const width = meta.width || 2160
  const height = meta.height || 2160
  const fontSize = Math.floor(height * 0.04)
  const padding = Math.floor(fontSize * 0.5)
  const barHeight = fontSize + padding * 2
  const svg = await createLabelSVG(width, barHeight, fontSize, padding, labelText)

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

  const keyPrefix =
    type === 'character'
      ? `global-char-${id}-${appearanceIndex}-upload`
      : `global-loc-${id}-upload`
  const key = generateUniqueKey(keyPrefix, 'jpg')
  await uploadObject(processed, key)

  if (type === 'character') {
    const parsedAppearanceIndex = typeof appearanceIndex === 'string' ? Number.parseInt(appearanceIndex, 10) : Number.NaN
    if (!Number.isFinite(parsedAppearanceIndex)) {
      throw new ApiError('INVALID_PARAMS')
    }

    const appearance = await prisma.globalCharacterAppearance.findFirst({
      where: {
        characterId: id,
        appearanceIndex: parsedAppearanceIndex,
        character: { userId: session.user.id },
      },
    })
    if (!appearance) {
      throw new ApiError('NOT_FOUND')
    }

    const currentImageUrls = decodeImageUrlsFromDb(
      appearance.imageUrls,
      'globalCharacterAppearance.imageUrls',
    )
    if (appearance.imageUrl || currentImageUrls.length > 0) {
      await prisma.globalCharacterAppearance.update({
        where: { id: appearance.id },
        data: {
          previousImageUrl: appearance.imageUrl,
          previousImageUrls: appearance.imageUrls,
        },
      })
    }

    const imageUrls = [...currentImageUrls]
    const targetIndex = typeof imageIndex === 'string' ? Number.parseInt(imageIndex, 10) : imageUrls.length
    while (imageUrls.length <= targetIndex) {
      imageUrls.push('')
    }
    imageUrls[targetIndex] = key

    const selectedIndex = appearance.selectedIndex
    const shouldUpdateImageUrl =
      selectedIndex === targetIndex ||
      (selectedIndex === null && targetIndex === 0) ||
      imageUrls.filter(Boolean).length === 1

    const updateData: Record<string, unknown> = {
      imageUrls: encodeImageUrls(imageUrls),
    }
    if (shouldUpdateImageUrl) {
      updateData.imageUrl = key
    }

    await prisma.globalCharacterAppearance.update({
      where: { id: appearance.id },
      data: updateData,
    })

    return Response.json({ success: true, imageKey: key, imageIndex: targetIndex })
  }

  if (type === 'location') {
    const location = await prisma.globalLocation.findFirst({
      where: { id, userId: session.user.id },
      include: { images: { orderBy: { imageIndex: 'asc' } } },
    })
    if (!location) {
      throw new ApiError('NOT_FOUND')
    }

    if (typeof imageIndex === 'string') {
      const targetImageIndex = Number.parseInt(imageIndex, 10)
      const existingImage = location.images.find((image) => image.imageIndex === targetImageIndex)

      if (existingImage) {
        if (existingImage.imageUrl) {
          await prisma.globalLocationImage.update({
            where: { id: existingImage.id },
            data: { previousImageUrl: existingImage.imageUrl },
          })
        }
        await prisma.globalLocationImage.update({
          where: { id: existingImage.id },
          data: { imageUrl: key },
        })
      } else {
        await prisma.globalLocationImage.create({
          data: {
            locationId: id,
            imageIndex: targetImageIndex,
            imageUrl: key,
            description: labelText,
            isSelected: targetImageIndex === 0,
          },
        })
      }

      return Response.json({ success: true, imageKey: key, imageIndex: targetImageIndex })
    }

    const maxIndex = location.images.length
    await prisma.globalLocationImage.create({
      data: {
        locationId: id,
        imageIndex: maxIndex,
        imageUrl: key,
        description: labelText,
        isSelected: maxIndex === 0,
      },
    })

    return Response.json({ success: true, imageKey: key, imageIndex: maxIndex })
  }

  throw new ApiError('INVALID_PARAMS')
}

export async function handleUndoAssetHubImageRequest(request: Request) {
  const session = await requireAssetHubUserSession()
  if (session instanceof Response) return session

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const type = typeof body.type === 'string' ? body.type : ''
  const id = typeof body.id === 'string' ? body.id : ''
  const appearanceIndex =
    typeof body.appearanceIndex === 'number' ? body.appearanceIndex : PRIMARY_APPEARANCE_INDEX

  if (type === 'character') {
    const appearance = await prisma.globalCharacterAppearance.findFirst({
      where: {
        characterId: id,
        appearanceIndex,
        character: { userId: session.user.id },
      },
    })
    if (!appearance) {
      throw new ApiError('NOT_FOUND')
    }

    const previousImageUrls = decodeImageUrlsFromDb(
      appearance.previousImageUrls,
      'globalCharacterAppearance.previousImageUrls',
    )
    if (!appearance.previousImageUrl && previousImageUrls.length === 0) {
      throw new ApiError('INVALID_PARAMS')
    }

    const restoredImageUrls =
      previousImageUrls.length > 0
        ? previousImageUrls
        : appearance.previousImageUrl
          ? [appearance.previousImageUrl]
          : []

    await prisma.globalCharacterAppearance.update({
      where: { id: appearance.id },
      data: {
        imageUrl: appearance.previousImageUrl || restoredImageUrls[0] || null,
        imageUrls: encodeImageUrls(restoredImageUrls),
        previousImageUrl: null,
        previousImageUrls: encodeImageUrls([]),
        selectedIndex: null,
        description: appearance.previousDescription ?? appearance.description,
        descriptions: appearance.previousDescriptions ?? appearance.descriptions,
        previousDescription: null,
        previousDescriptions: null,
      },
    })

    return Response.json({ success: true, message: '已撤回到上一版本（图片和描述词）' })
  }

  if (type === 'location') {
    const location = await prisma.globalLocation.findFirst({
      where: { id, userId: session.user.id },
      include: { images: true },
    })
    if (!location) {
      throw new ApiError('NOT_FOUND')
    }

    for (const image of location.images) {
      if (!image.previousImageUrl) continue
      await prisma.globalLocationImage.update({
        where: { id: image.id },
        data: {
          imageUrl: image.previousImageUrl,
          previousImageUrl: null,
          description: image.previousDescription ?? image.description,
          previousDescription: null,
        },
      })
    }

    return Response.json({ success: true, message: '已撤回到上一版本（图片和描述词）' })
  }

  throw new ApiError('INVALID_PARAMS')
}

