import { ApiError } from '@/lib/api-errors'
import { logError as _ulogError, logInfo as _ulogInfo } from '@/lib/logging/core'
import { prisma } from '@/lib/prisma'
import { deleteObject, getSignedUrl, toFetchableUrl } from '@/lib/storage'
import { decodeImageUrlsFromDb, encodeImageUrls } from '@/lib/contracts/image-urls-contract'
import { resolveStorageKeyFromMediaValue } from '@/lib/media/service'
import { isErrorResponse, requireProjectAuth, requireProjectAuthLight } from '@engine/api-auth'
import { cleanupNovelPromotionUnselectedImages } from '@engine/services/novel-promotion-asset-service'
import {
  selectNovelPromotionPanelCandidate,
  updateNovelPromotionShotPrompt,
} from '@engine/services/novel-promotion-editing-service'

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function readOptionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function readOptionalNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
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

export async function handleNovelPromotionPanelCandidateSelectRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const panelId = readOptionalString(body.panelId)
  if (!panelId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await selectNovelPromotionPanelCandidate({
    panelId,
    selectedImageUrl: readOptionalString(body.selectedImageUrl),
    action: readOptionalString(body.action),
  })
  return Response.json(payload)
}

export async function handleNovelPromotionShotPromptUpdateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const field = readOptionalString(body.field)
  if (field !== 'imagePrompt' && field !== 'videoPrompt') {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await updateNovelPromotionShotPrompt({
    shotId: readOptionalString(body.shotId) || '',
    field,
    value: body.value,
  })
  return Response.json(payload)
}

export async function handleNovelPromotionCleanupUnselectedImagesRequest(
  _request: Request,
  projectId: string,
) {
  const authResult = await requireFullProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const payload = await cleanupNovelPromotionUnselectedImages(authResult.novelData.id)
  return Response.json(payload)
}

export async function handleNovelPromotionVideoProxyRequest(
  request: Request,
  projectId: string,
) {
  const videoKey = new URL(request.url).searchParams.get('key')
  if (!videoKey) {
    throw new ApiError('INVALID_PARAMS')
  }

  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const fetchUrl = videoKey.startsWith('http://') || videoKey.startsWith('https://')
    ? videoKey
    : toFetchableUrl(getSignedUrl(videoKey, 3600))

  _ulogInfo(`[视频代理] 下载: ${fetchUrl.substring(0, 100)}...`)

  const response = await fetch(fetchUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch video: ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') || 'video/mp4'
  const contentLength = response.headers.get('content-length')
  const headers: HeadersInit = {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache',
  }
  if (contentLength) {
    headers['Content-Length'] = contentLength
  }

  return new Response(response.body, { headers })
}

export async function handleNovelPromotionUndoRegenerateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireLightProjectAccess(projectId)
  if (authResult instanceof Response) return authResult

  const body = toRecord(await request.json().catch(() => ({})))
  const type = readOptionalString(body.type)
  const id = readOptionalString(body.id)
  if (!type || !id) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (type === 'character') {
    const appearanceId = readOptionalString(body.appearanceId)
    if (!appearanceId) {
      throw new ApiError('INVALID_PARAMS')
    }
    return undoCharacterRegenerate(appearanceId)
  }

  if (type === 'location') {
    return undoLocationRegenerate(id)
  }

  if (type === 'panel') {
    return undoPanelRegenerate(id)
  }

  throw new ApiError('INVALID_PARAMS')
}

async function undoCharacterRegenerate(appearanceId: string) {
  const appearance = await prisma.characterAppearance.findUnique({
    where: { id: appearanceId },
  })
  if (!appearance) {
    throw new ApiError('NOT_FOUND')
  }

  const previousImageUrls = decodeImageUrlsFromDb(
    appearance.previousImageUrls,
    'characterAppearance.previousImageUrls',
  )
  if (!appearance.previousImageUrl && previousImageUrls.length === 0) {
    throw new ApiError('INVALID_PARAMS')
  }

  const currentImageUrls = decodeImageUrlsFromDb(
    appearance.imageUrls,
    'characterAppearance.imageUrls',
  )
  for (const imageUrl of currentImageUrls) {
    if (!imageUrl) continue
    try {
      const storageKey = await resolveStorageKeyFromMediaValue(imageUrl)
      if (storageKey) {
        await deleteObject(storageKey)
      }
    } catch {
      // 撤回时允许单张清理失败，不阻断主流程
    }
  }

  const restoredImageUrls = previousImageUrls.length > 0
    ? previousImageUrls
    : appearance.previousImageUrl
      ? [appearance.previousImageUrl]
      : []

  await prisma.characterAppearance.update({
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

  return Response.json({
    success: true,
    message: '已撤回到上一版本（图片和描述词）',
  })
}

async function undoLocationRegenerate(locationId: string) {
  const location = await prisma.novelPromotionLocation.findUnique({
    where: { id: locationId },
    include: { images: { orderBy: { imageIndex: 'asc' } } },
  })
  if (!location) {
    throw new ApiError('NOT_FOUND')
  }

  const hasPrevious = location.images.some((image) => image.previousImageUrl)
  if (!hasPrevious) {
    throw new ApiError('INVALID_PARAMS')
  }

  await prisma.$transaction(async (tx) => {
    for (const image of location.images) {
      if (!image.previousImageUrl) continue
      if (image.imageUrl) {
        try {
          const storageKey = await resolveStorageKeyFromMediaValue(image.imageUrl)
          if (storageKey) {
            await deleteObject(storageKey)
          }
        } catch {
          // 撤回时允许单张清理失败，不阻断主流程
        }
      }

      await tx.locationImage.update({
        where: { id: image.id },
        data: {
          imageUrl: image.previousImageUrl,
          previousImageUrl: null,
          description: image.previousDescription ?? image.description,
          previousDescription: null,
        },
      })
    }
  })

  return Response.json({
    success: true,
    message: '已撤回到上一版本（图片和描述词）',
  })
}

async function undoPanelRegenerate(panelId: string) {
  const panel = await prisma.novelPromotionPanel.findUnique({
    where: { id: panelId },
  })
  if (!panel) {
    throw new ApiError('NOT_FOUND')
  }
  if (!panel.previousImageUrl) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (panel.imageUrl) {
    try {
      const storageKey = await resolveStorageKeyFromMediaValue(panel.imageUrl)
      if (storageKey) {
        await deleteObject(storageKey)
      }
    } catch (error) {
      _ulogError('[undo-regenerate] 删除当前 panel 图片失败', error)
    }
  }

  await prisma.novelPromotionPanel.update({
    where: { id: panelId },
    data: {
      imageUrl: panel.previousImageUrl,
      previousImageUrl: null,
      candidateImages: null,
    },
  })

  return Response.json({
    success: true,
    message: '镜头图片已撤回到上一版本',
  })
}

