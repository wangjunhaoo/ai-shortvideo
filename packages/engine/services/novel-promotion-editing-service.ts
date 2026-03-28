import { prisma } from '@engine/prisma'
import { ApiError } from '@/lib/api-errors'
import { attachMediaFieldsToProject } from '@/lib/media/attach'
import { resolveStorageKeyFromMediaValue } from '@/lib/media/service'
import { serializeStructuredJsonField } from '@/lib/novel-promotion/panel-ai-data-sync'
import {
  downloadAndUploadImage,
  generateUniqueKey,
  getSignedUrl,
  toFetchableUrl,
} from '@/lib/storage'

interface PanelHistoryEntry {
  url: string
  timestamp: string
}

function parseNullableNumberField(value: unknown): number | null {
  if (value === null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  throw new ApiError('INVALID_PARAMS')
}

function toStructuredJsonField(value: unknown, fieldName: string): string | null {
  try {
    return serializeStructuredJsonField(value, fieldName)
  } catch (error) {
    const message = error instanceof Error ? error.message : `${fieldName} must be valid JSON`
    throw new ApiError('INVALID_PARAMS', { message })
  }
}

function parseUnknownArray(jsonValue: string | null): unknown[] {
  if (!jsonValue) return []
  try {
    const parsed = JSON.parse(jsonValue)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parsePanelHistory(jsonValue: string | null): PanelHistoryEntry[] {
  return parseUnknownArray(jsonValue).filter((entry): entry is PanelHistoryEntry => {
    if (!entry || typeof entry !== 'object') return false
    const candidate = entry as { url?: unknown; timestamp?: unknown }
    return typeof candidate.url === 'string' && typeof candidate.timestamp === 'string'
  })
}

export async function updateNovelPromotionClip(input: {
  clipId: string
  body: Record<string, unknown>
}) {
  const updateData: {
    characters?: string | null
    location?: string | null
    content?: string
    screenplay?: string | null
  } = {}

  if (input.body.characters !== undefined) {
    updateData.characters = input.body.characters as string | null
  }
  if (input.body.location !== undefined) {
    updateData.location = input.body.location as string | null
  }
  if (input.body.content !== undefined) {
    updateData.content = input.body.content as string
  }
  if (input.body.screenplay !== undefined) {
    updateData.screenplay = input.body.screenplay as string | null
  }

  const clip = await prisma.novelPromotionClip.update({
    where: { id: input.clipId },
    data: updateData,
  })

  return { success: true, clip }
}

export async function updateNovelPromotionShotPrompt(input: {
  shotId: string
  field: string
  value: unknown
}) {
  if (!input.shotId) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (input.field !== 'imagePrompt' && input.field !== 'videoPrompt') {
    throw new ApiError('INVALID_PARAMS')
  }

  const shot = await prisma.novelPromotionShot.update({
    where: { id: input.shotId },
    data: { [input.field]: input.value },
  })

  return { success: true, shot }
}

export async function updateNovelPromotionPanelLink(input: {
  storyboardId: string
  panelIndex: number
  linked: boolean
}) {
  if (!input.storyboardId || input.panelIndex === undefined || input.linked === undefined) {
    throw new ApiError('INVALID_PARAMS')
  }

  await prisma.novelPromotionPanel.update({
    where: {
      storyboardId_panelIndex: {
        storyboardId: input.storyboardId,
        panelIndex: input.panelIndex,
      },
    },
    data: {
      linkedToNextPanel: input.linked,
    },
  })

  return { success: true }
}

export async function createNovelPromotionStoryboardGroup(input: {
  episodeId: string
  insertIndex?: number
}) {
  if (!input.episodeId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const episode = await prisma.novelPromotionEpisode.findUnique({
    where: { id: input.episodeId },
    include: {
      clips: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!episode) {
    throw new ApiError('NOT_FOUND')
  }

  const existingClips = episode.clips
  const insertAt = input.insertIndex !== undefined ? input.insertIndex : existingClips.length

  let newCreatedAt: Date
  if (existingClips.length === 0) {
    newCreatedAt = new Date()
  } else if (insertAt === 0) {
    newCreatedAt = new Date(existingClips[0].createdAt.getTime() - 1000)
  } else if (insertAt >= existingClips.length) {
    newCreatedAt = new Date(existingClips[existingClips.length - 1].createdAt.getTime() + 1000)
  } else {
    const previousClip = existingClips[insertAt - 1]
    const nextClip = existingClips[insertAt]
    const middleTime = (previousClip.createdAt.getTime() + nextClip.createdAt.getTime()) / 2
    newCreatedAt = new Date(middleTime)
  }

  const result = await prisma.$transaction(async (tx) => {
    const clip = await tx.novelPromotionClip.create({
      data: {
        episodeId: input.episodeId,
        summary: '手动添加的分镜组',
        content: '',
        location: null,
        characters: null,
        createdAt: newCreatedAt,
      },
    })

    const storyboard = await tx.novelPromotionStoryboard.create({
      data: {
        episodeId: input.episodeId,
        clipId: clip.id,
        panelCount: 1,
      },
    })

    const panel = await tx.novelPromotionPanel.create({
      data: {
        storyboardId: storyboard.id,
        panelIndex: 0,
        panelNumber: 1,
        shotType: '中景',
        cameraMove: '固定',
        description: '新镜头描述',
        characters: '[]',
      },
    })

    return { clip, storyboard, panel }
  })

  return {
    success: true,
    clip: result.clip,
    storyboard: result.storyboard,
    panel: result.panel,
  }
}

export async function moveNovelPromotionStoryboardGroup(input: {
  episodeId: string
  clipId: string
  direction: string
}) {
  if (!input.episodeId || !input.clipId || !input.direction) {
    throw new ApiError('INVALID_PARAMS')
  }

  const episode = await prisma.novelPromotionEpisode.findUnique({
    where: { id: input.episodeId },
    include: {
      clips: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!episode) {
    throw new ApiError('NOT_FOUND')
  }

  const clips = episode.clips
  const currentIndex = clips.findIndex((clip) => clip.id === input.clipId)
  if (currentIndex === -1) {
    throw new ApiError('NOT_FOUND')
  }

  const targetIndex = input.direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= clips.length) {
    throw new ApiError('INVALID_PARAMS')
  }

  const currentClip = clips[currentIndex]
  const targetClip = clips[targetIndex]
  const currentTime = currentClip.createdAt.getTime()
  const targetTime = targetClip.createdAt.getTime()

  await prisma.$transaction(async (tx) => {
    await tx.novelPromotionClip.update({
      where: { id: currentClip.id },
      data: { createdAt: new Date(0) },
    })

    await tx.novelPromotionClip.update({
      where: { id: targetClip.id },
      data: { createdAt: new Date(currentTime) },
    })

    await tx.novelPromotionClip.update({
      where: { id: currentClip.id },
      data: { createdAt: new Date(targetTime) },
    })
  })

  return { success: true }
}

export async function deleteNovelPromotionStoryboardGroup(storyboardId: string) {
  if (!storyboardId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const storyboard = await prisma.novelPromotionStoryboard.findUnique({
    where: { id: storyboardId },
    include: {
      panels: true,
      clip: true,
    },
  })

  if (!storyboard) {
    throw new ApiError('NOT_FOUND')
  }

  await prisma.$transaction(async (tx) => {
    await tx.novelPromotionPanel.deleteMany({
      where: { storyboardId },
    })

    await tx.novelPromotionStoryboard.delete({
      where: { id: storyboardId },
    })

    if (storyboard.clipId) {
      await tx.novelPromotionClip.delete({
        where: { id: storyboard.clipId },
      })
    }
  })

  return { success: true }
}

export async function updateNovelPromotionPhotographyPlan(input: {
  storyboardId: string
  photographyPlan: unknown
}) {
  if (!input.storyboardId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const storyboard = await prisma.novelPromotionStoryboard.findUnique({
    where: { id: input.storyboardId },
  })

  if (!storyboard) {
    throw new ApiError('NOT_FOUND')
  }

  const photographyPlanJson = input.photographyPlan ? JSON.stringify(input.photographyPlan) : null

  await prisma.novelPromotionStoryboard.update({
    where: { id: input.storyboardId },
    data: { photographyPlan: photographyPlanJson },
  })

  return { success: true }
}

export async function selectNovelPromotionPanelCandidate(input: {
  panelId: string
  selectedImageUrl?: string
  action?: string
}) {
  if (!input.panelId) {
    throw new ApiError('INVALID_PARAMS')
  }

  if (input.action === 'cancel') {
    await prisma.novelPromotionPanel.update({
      where: { id: input.panelId },
      data: { candidateImages: null },
    })

    return {
      success: true,
      message: '已取消选择',
    }
  }

  if (!input.selectedImageUrl) {
    throw new ApiError('INVALID_PARAMS')
  }

  const panel = await prisma.novelPromotionPanel.findUnique({
    where: { id: input.panelId },
  })

  if (!panel) {
    throw new ApiError('NOT_FOUND')
  }

  const candidateImages = parseUnknownArray(panel.candidateImages)
  const selectedStorageKey = await resolveStorageKeyFromMediaValue(input.selectedImageUrl)
  const candidateKeys = (
    await Promise.all(candidateImages.map((candidate) => resolveStorageKeyFromMediaValue(candidate)))
  ).filter((key): key is string => !!key)

  if (!selectedStorageKey || !candidateKeys.includes(selectedStorageKey)) {
    throw new ApiError('INVALID_PARAMS')
  }

  const currentHistory = parsePanelHistory(panel.imageHistory)
  if (panel.imageUrl) {
    currentHistory.push({
      url: panel.imageUrl,
      timestamp: new Date().toISOString(),
    })
  }

  let finalImageKey = selectedStorageKey
  const reusableKey = !finalImageKey.startsWith('http://')
    && !finalImageKey.startsWith('https://')
    && !finalImageKey.startsWith('/')

  if (!reusableKey) {
    const sourceUrl = toFetchableUrl(input.selectedImageUrl)
    const cosKey = generateUniqueKey(`panel-${panel.id}-selected`, 'png')
    finalImageKey = await downloadAndUploadImage(sourceUrl, cosKey)
  }

  await prisma.novelPromotionPanel.update({
    where: { id: input.panelId },
    data: {
      imageUrl: finalImageKey,
      imageHistory: JSON.stringify(currentHistory),
      candidateImages: null,
    },
  })

  return {
    success: true,
    imageUrl: getSignedUrl(finalImageKey, 7 * 24 * 3600),
    cosKey: finalImageKey,
    message: '已选择图片',
  }
}

export async function getNovelPromotionStoryboards(episodeId: string) {
  if (!episodeId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const storyboards = await prisma.novelPromotionStoryboard.findMany({
    where: { episodeId },
    include: {
      clip: true,
      panels: { orderBy: { panelIndex: 'asc' } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const withMedia = await attachMediaFieldsToProject({ storyboards })
  return {
    storyboards: withMedia.storyboards || storyboards,
  }
}

export async function clearNovelPromotionStoryboardError(storyboardId: string) {
  if (!storyboardId) {
    throw new ApiError('INVALID_PARAMS')
  }

  await prisma.novelPromotionStoryboard.update({
    where: { id: storyboardId },
    data: { lastError: null },
  })

  return { success: true }
}

export async function createNovelPromotionPanel(input: {
  storyboardId: string
  shotType?: string | null
  cameraMove?: string | null
  description?: string | null
  location?: string | null
  characters?: string | null
  srtStart?: number | null
  srtEnd?: number | null
  duration?: number | null
  videoPrompt?: string | null
  firstLastFramePrompt?: string | null
}) {
  if (!input.storyboardId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const storyboard = await prisma.novelPromotionStoryboard.findUnique({
    where: { id: input.storyboardId },
    include: {
      panels: {
        orderBy: { panelIndex: 'desc' },
        take: 1,
      },
    },
  })

  if (!storyboard) {
    throw new ApiError('NOT_FOUND')
  }

  const maxPanelIndex = storyboard.panels.length > 0 ? storyboard.panels[0].panelIndex : -1
  const newPanelIndex = maxPanelIndex + 1
  const newPanelNumber = newPanelIndex + 1

  const panel = await prisma.novelPromotionPanel.create({
    data: {
      storyboardId: input.storyboardId,
      panelIndex: newPanelIndex,
      panelNumber: newPanelNumber,
      shotType: input.shotType ?? null,
      cameraMove: input.cameraMove ?? null,
      description: input.description ?? null,
      location: input.location ?? null,
      characters: input.characters ?? null,
      srtStart: input.srtStart ?? null,
      srtEnd: input.srtEnd ?? null,
      duration: input.duration ?? null,
      videoPrompt: input.videoPrompt ?? null,
      firstLastFramePrompt: input.firstLastFramePrompt ?? null,
    },
  })

  const panelCount = await prisma.novelPromotionPanel.count({
    where: { storyboardId: input.storyboardId },
  })

  await prisma.novelPromotionStoryboard.update({
    where: { id: input.storyboardId },
    data: { panelCount },
  })

  return { success: true, panel }
}

export async function deleteNovelPromotionPanel(panelId: string) {
  if (!panelId) {
    throw new ApiError('INVALID_PARAMS')
  }

  const panel = await prisma.novelPromotionPanel.findUnique({
    where: { id: panelId },
  })

  if (!panel) {
    throw new ApiError('NOT_FOUND')
  }

  const storyboardId = panel.storyboardId

  await prisma.$transaction(async (tx) => {
    await tx.novelPromotionPanel.delete({
      where: { id: panelId },
    })

    const deletedPanelIndex = panel.panelIndex
    const maxPanel = await tx.novelPromotionPanel.findFirst({
      where: { storyboardId },
      orderBy: { panelIndex: 'desc' },
      select: { panelIndex: true },
    })
    const maxPanelIndex = maxPanel?.panelIndex ?? -1
    const offset = maxPanelIndex + 1000

    await tx.novelPromotionPanel.updateMany({
      where: {
        storyboardId,
        panelIndex: { gt: deletedPanelIndex },
      },
      data: {
        panelIndex: { increment: offset },
        panelNumber: { increment: offset },
      },
    })

    await tx.novelPromotionPanel.updateMany({
      where: {
        storyboardId,
        panelIndex: { gt: deletedPanelIndex + offset },
      },
      data: {
        panelIndex: { decrement: offset + 1 },
        panelNumber: { decrement: offset + 1 },
      },
    })

    const panelCount = await tx.novelPromotionPanel.count({
      where: { storyboardId },
    })

    await tx.novelPromotionStoryboard.update({
      where: { id: storyboardId },
      data: { panelCount },
    })
  }, {
    maxWait: 15000,
    timeout: 30000,
  })

  return { success: true }
}

export async function patchNovelPromotionPanel(input: {
  panelId?: string
  storyboardId?: string
  panelIndex?: number
  videoPrompt?: string | null
  firstLastFramePrompt?: string | null
}) {
  if (input.panelId) {
    const panel = await prisma.novelPromotionPanel.findUnique({
      where: { id: input.panelId },
    })

    if (!panel) {
      throw new ApiError('NOT_FOUND')
    }

    const updateData: {
      videoPrompt?: string | null
      firstLastFramePrompt?: string | null
    } = {}
    if (input.videoPrompt !== undefined) updateData.videoPrompt = input.videoPrompt
    if (input.firstLastFramePrompt !== undefined) updateData.firstLastFramePrompt = input.firstLastFramePrompt

    await prisma.novelPromotionPanel.update({
      where: { id: input.panelId },
      data: updateData,
    })

    return { success: true }
  }

  if (!input.storyboardId || input.panelIndex === undefined) {
    throw new ApiError('INVALID_PARAMS')
  }

  const storyboard = await prisma.novelPromotionStoryboard.findUnique({
    where: { id: input.storyboardId },
  })

  if (!storyboard) {
    throw new ApiError('NOT_FOUND')
  }

  const updateData: {
    videoPrompt?: string | null
    firstLastFramePrompt?: string | null
  } = {}
  if (input.videoPrompt !== undefined) updateData.videoPrompt = input.videoPrompt
  if (input.firstLastFramePrompt !== undefined) updateData.firstLastFramePrompt = input.firstLastFramePrompt

  const updatedPanel = await prisma.novelPromotionPanel.updateMany({
    where: {
      storyboardId: input.storyboardId,
      panelIndex: input.panelIndex,
    },
    data: updateData,
  })

  if (updatedPanel.count === 0) {
    await prisma.novelPromotionPanel.create({
      data: {
        storyboardId: input.storyboardId,
        panelIndex: input.panelIndex,
        panelNumber: input.panelIndex + 1,
        imageUrl: null,
        videoPrompt: input.videoPrompt ?? null,
        firstLastFramePrompt: input.firstLastFramePrompt ?? null,
      },
    })
  }

  return { success: true }
}

export async function putNovelPromotionPanel(input: {
  storyboardId?: string
  panelIndex?: number
  panelNumber?: number | null
  shotType?: string | null
  cameraMove?: string | null
  description?: string | null
  location?: string | null
  characters?: string | null
  srtStart?: unknown
  srtEnd?: unknown
  duration?: unknown
  videoPrompt?: string | null
  firstLastFramePrompt?: string | null
  actingNotes?: unknown
  photographyRules?: unknown
}) {
  if (!input.storyboardId || input.panelIndex === undefined) {
    throw new ApiError('INVALID_PARAMS')
  }

  const storyboard = await prisma.novelPromotionStoryboard.findUnique({
    where: { id: input.storyboardId },
  })

  if (!storyboard) {
    throw new ApiError('NOT_FOUND')
  }

  const updateData: {
    panelNumber?: number | null
    shotType?: string | null
    cameraMove?: string | null
    description?: string | null
    location?: string | null
    characters?: string | null
    srtStart?: number | null
    srtEnd?: number | null
    duration?: number | null
    videoPrompt?: string | null
    firstLastFramePrompt?: string | null
    actingNotes?: string | null
    photographyRules?: string | null
  } = {}
  if (input.panelNumber !== undefined) updateData.panelNumber = input.panelNumber
  if (input.shotType !== undefined) updateData.shotType = input.shotType
  if (input.cameraMove !== undefined) updateData.cameraMove = input.cameraMove
  if (input.description !== undefined) updateData.description = input.description
  if (input.location !== undefined) updateData.location = input.location
  if (input.characters !== undefined) updateData.characters = input.characters
  if (input.srtStart !== undefined) updateData.srtStart = parseNullableNumberField(input.srtStart)
  if (input.srtEnd !== undefined) updateData.srtEnd = parseNullableNumberField(input.srtEnd)
  if (input.duration !== undefined) updateData.duration = parseNullableNumberField(input.duration)
  if (input.videoPrompt !== undefined) updateData.videoPrompt = input.videoPrompt
  if (input.firstLastFramePrompt !== undefined) updateData.firstLastFramePrompt = input.firstLastFramePrompt
  if (input.actingNotes !== undefined) updateData.actingNotes = toStructuredJsonField(input.actingNotes, 'actingNotes')
  if (input.photographyRules !== undefined) updateData.photographyRules = toStructuredJsonField(input.photographyRules, 'photographyRules')

  const existingPanel = await prisma.novelPromotionPanel.findUnique({
    where: {
      storyboardId_panelIndex: {
        storyboardId: input.storyboardId,
        panelIndex: input.panelIndex,
      },
    },
  })

  if (existingPanel) {
    await prisma.novelPromotionPanel.update({
      where: { id: existingPanel.id },
      data: updateData,
    })
  } else {
    await prisma.novelPromotionPanel.create({
      data: {
        storyboardId: input.storyboardId,
        panelIndex: input.panelIndex,
        panelNumber: input.panelNumber ?? input.panelIndex + 1,
        shotType: input.shotType ?? null,
        cameraMove: input.cameraMove ?? null,
        description: input.description ?? null,
        location: input.location ?? null,
        characters: input.characters ?? null,
        srtStart: input.srtStart !== undefined ? parseNullableNumberField(input.srtStart) : null,
        srtEnd: input.srtEnd !== undefined ? parseNullableNumberField(input.srtEnd) : null,
        duration: input.duration !== undefined ? parseNullableNumberField(input.duration) : null,
        videoPrompt: input.videoPrompt ?? null,
        firstLastFramePrompt: input.firstLastFramePrompt ?? null,
        actingNotes: input.actingNotes !== undefined ? toStructuredJsonField(input.actingNotes, 'actingNotes') : null,
        photographyRules: input.photographyRules !== undefined ? toStructuredJsonField(input.photographyRules, 'photographyRules') : null,
      },
    })
  }

  const panelCount = await prisma.novelPromotionPanel.count({
    where: { storyboardId: input.storyboardId },
  })

  await prisma.novelPromotionStoryboard.update({
    where: { id: input.storyboardId },
    data: { panelCount },
  })

  return { success: true }
}
