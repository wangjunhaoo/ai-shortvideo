import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'
import { ApiError } from '@/lib/api-errors'
import { resolveStorageKeyFromMediaValue } from '@/lib/media/service'
import { getObjectBuffer, toFetchableUrl } from '@/lib/storage'
import { prisma } from '@engine/prisma'
import archiver from 'archiver'

interface DownloadPanelRecord {
  panelIndex: number | null
  description: string | null
  imageUrl: string | null
  videoUrl: string | null
  lipSyncVideoUrl: string | null
}

interface DownloadStoryboardRecord {
  id: string
  clipId: string
  panels: DownloadPanelRecord[]
}

interface DownloadClipRecord {
  id: string
}

interface DownloadEpisodeRecord {
  id: string
  storyboards: DownloadStoryboardRecord[]
  clips: DownloadClipRecord[]
}

interface VoiceLineRecord {
  lineIndex: number
  speaker: string
  content: string
  audioUrl: string | null
}

interface OrderedImageItem {
  description: string
  imageUrl: string
  clipIndex: number
  panelIndex: number
  index: number
}

interface OrderedVideoItem {
  description: string
  videoUrl: string
  clipIndex: number
  panelIndex: number
  index: number
}

function sanitizeFilePart(value: string, maxLength = 50) {
  return value.slice(0, maxLength).replace(/[\\/:*?"<>|]/g, '_')
}

async function fetchBinaryByMediaValue(mediaValue: string) {
  const storageKey = await resolveStorageKeyFromMediaValue(mediaValue)

  if (mediaValue.startsWith('http://') || mediaValue.startsWith('https://')) {
    const response = await fetch(toFetchableUrl(mediaValue))
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }
    return {
      data: Buffer.from(await response.arrayBuffer()),
      storageKey,
      contentType: response.headers.get('content-type'),
    }
  }

  if (storageKey) {
    return {
      data: await getObjectBuffer(storageKey),
      storageKey,
      contentType: null,
    }
  }

  const response = await fetch(toFetchableUrl(mediaValue))
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`)
  }

  return {
    data: Buffer.from(await response.arrayBuffer()),
    storageKey: null,
    contentType: response.headers.get('content-type'),
  }
}

async function loadEpisodesForMedia(projectId: string, episodeId?: string | null): Promise<DownloadEpisodeRecord[]> {
  if (episodeId) {
    const episode = await prisma.novelPromotionEpisode.findFirst({
      where: {
        id: episodeId,
        novelPromotionProject: { projectId },
      },
      select: {
        id: true,
        storyboards: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            clipId: true,
            panels: {
              orderBy: { panelIndex: 'asc' },
              select: {
                panelIndex: true,
                description: true,
                imageUrl: true,
                videoUrl: true,
                lipSyncVideoUrl: true,
              },
            },
          },
        },
        clips: {
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        },
      },
    })

    return episode ? [episode] : []
  }

  const projectData = await prisma.novelPromotionProject.findFirst({
    where: { projectId },
    select: {
      episodes: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          storyboards: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              clipId: true,
              panels: {
                orderBy: { panelIndex: 'asc' },
                select: {
                  panelIndex: true,
                  description: true,
                  imageUrl: true,
                  videoUrl: true,
                  lipSyncVideoUrl: true,
                },
              },
            },
          },
          clips: {
            orderBy: { createdAt: 'asc' },
            select: { id: true },
          },
        },
      },
    },
  })

  return projectData?.episodes ?? []
}

function collectOrderedImages(episodes: DownloadEpisodeRecord[]): OrderedImageItem[] {
  const allStoryboards = episodes.flatMap((episode) => episode.storyboards)
  const allClips = episodes.flatMap((episode) => episode.clips)

  const images = allStoryboards.flatMap((storyboard) => {
    const clipIndex = allClips.findIndex((clip) => clip.id === storyboard.clipId)

    return storyboard.panels
      .filter((panel) => !!panel.imageUrl)
      .map((panel) => ({
        description: panel.description || '镜头',
        imageUrl: panel.imageUrl as string,
        clipIndex: clipIndex >= 0 ? clipIndex : 999,
        panelIndex: panel.panelIndex || 0,
      }))
  })

  images.sort((a, b) => {
    if (a.clipIndex !== b.clipIndex) return a.clipIndex - b.clipIndex
    return a.panelIndex - b.panelIndex
  })

  return images.map((item, index) => ({
    ...item,
    index: index + 1,
  }))
}

function collectOrderedVideos(
  episodes: DownloadEpisodeRecord[],
  panelPreferences?: Record<string, boolean>,
): OrderedVideoItem[] {
  const allStoryboards = episodes.flatMap((episode) => episode.storyboards)
  const allClips = episodes.flatMap((episode) => episode.clips)

  const videos = allStoryboards.flatMap((storyboard) => {
    const clipIndex = allClips.findIndex((clip) => clip.id === storyboard.clipId)

    return storyboard.panels.flatMap((panel) => {
      const panelKey = `${storyboard.id}-${panel.panelIndex || 0}`
      const preferLipSync = panelPreferences?.[panelKey] ?? true
      const resolvedVideoUrl = preferLipSync
        ? panel.lipSyncVideoUrl || panel.videoUrl
        : panel.videoUrl || panel.lipSyncVideoUrl

      if (!resolvedVideoUrl) {
        return []
      }

      return [{
        description: panel.description || '镜头',
        videoUrl: resolvedVideoUrl,
        clipIndex: clipIndex >= 0 ? clipIndex : 999,
        panelIndex: panel.panelIndex || 0,
      }]
    })
  })

  videos.sort((a, b) => {
    if (a.clipIndex !== b.clipIndex) return a.clipIndex - b.clipIndex
    return a.panelIndex - b.panelIndex
  })

  return videos.map((item, index) => ({
    ...item,
    index: index + 1,
  }))
}

async function loadVoiceLines(projectId: string, episodeId?: string | null): Promise<VoiceLineRecord[]> {
  if (episodeId) {
    const episode = await prisma.novelPromotionEpisode.findFirst({
      where: {
        id: episodeId,
        novelPromotionProject: { projectId },
      },
      select: { id: true },
    })

    if (!episode) {
      return []
    }
  }

  return prisma.novelPromotionVoiceLine.findMany({
    where: {
      audioUrl: { not: null },
      ...(episodeId
        ? { episodeId }
        : {
            episode: {
              novelPromotionProject: { projectId },
            },
          }),
    },
    orderBy: [{ lineIndex: 'asc' }],
    select: {
      lineIndex: true,
      speaker: true,
      content: true,
      audioUrl: true,
    },
  })
}

export async function downloadNovelPromotionImages(input: {
  projectId: string
  projectName: string
  episodeId?: string | null
}) {
  const images = collectOrderedImages(await loadEpisodesForMedia(input.projectId, input.episodeId))

  if (images.length === 0) {
    throw new ApiError('NOT_FOUND')
  }

  _ulogInfo(`Preparing to download ${images.length} images for project ${input.projectId}`)

  const archive = archiver('zip', { zlib: { level: 9 } })
  const stream = new ReadableStream({
    start(controller) {
      archive.on('data', (chunk) => controller.enqueue(chunk))
      archive.on('end', () => controller.close())
      archive.on('error', (err) => controller.error(err))

      void (async () => {
        for (const image of images) {
          try {
            _ulogInfo(`Downloading image ${image.index}: ${image.imageUrl}`)
            const { data, storageKey, contentType } = await fetchBinaryByMediaValue(image.imageUrl)

            let extension = 'png'
            if (contentType?.includes('jpeg') || contentType?.includes('jpg')) {
              extension = 'jpg'
            } else if (contentType?.includes('webp')) {
              extension = 'webp'
            } else {
              const keyExt = storageKey?.split('.').pop()?.toLowerCase()
              if (keyExt && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(keyExt)) {
                extension = keyExt === 'jpeg' ? 'jpg' : keyExt
              }
            }

            const fileName = `${String(image.index).padStart(3, '0')}_${sanitizeFilePart(image.description)}.${extension}`
            archive.append(data, { name: fileName })
            _ulogInfo(`Added ${fileName} to archive`)
          } catch (error) {
            _ulogError(`Failed to download image ${image.index}:`, error)
          }
        }

        await archive.finalize()
        _ulogInfo('Archive finalized')
      })()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(input.projectName)}_images.zip"`,
    },
  })
}

export async function downloadNovelPromotionVideos(input: {
  projectId: string
  projectName: string
  episodeId?: string | null
  panelPreferences?: Record<string, boolean>
}) {
  const videos = collectOrderedVideos(
    await loadEpisodesForMedia(input.projectId, input.episodeId),
    input.panelPreferences,
  )

  if (videos.length === 0) {
    throw new ApiError('NOT_FOUND')
  }

  _ulogInfo(`Preparing to download ${videos.length} videos for project ${input.projectId}`)

  const archive = archiver('zip', { zlib: { level: 9 } })
  const archiveFinished = new Promise<void>((resolve, reject) => {
    archive.on('end', () => resolve())
    archive.on('error', (err) => reject(err))
  })

  const chunks: Uint8Array[] = []
  archive.on('data', (chunk) => {
    chunks.push(chunk)
  })

  for (const video of videos) {
    try {
      _ulogInfo(`Downloading video ${video.index}: ${video.videoUrl}`)
      const { data } = await fetchBinaryByMediaValue(video.videoUrl)
      const fileName = `${String(video.index).padStart(3, '0')}_${sanitizeFilePart(video.description)}.mp4`
      archive.append(data, { name: fileName })
      _ulogInfo(`Added ${fileName} to archive`)
    } catch (error) {
      _ulogError(`Failed to download video ${video.index}:`, error)
    }
  }

  await archive.finalize()
  _ulogInfo('Archive finalized')
  await archiveFinished

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  return new Response(result, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(input.projectName)}_videos.zip"`,
    },
  })
}

export async function downloadNovelPromotionVoices(input: {
  projectId: string
  projectName: string
  episodeId?: string | null
}) {
  const voiceLines = await loadVoiceLines(input.projectId, input.episodeId)

  if (voiceLines.length === 0) {
    throw new ApiError('NOT_FOUND')
  }

  _ulogInfo(`Preparing to download ${voiceLines.length} voice lines for project ${input.projectId}`)

  const archive = archiver('zip', { zlib: { level: 9 } })
  const stream = new ReadableStream({
    start(controller) {
      archive.on('data', (chunk) => controller.enqueue(chunk))
      archive.on('end', () => controller.close())
      archive.on('error', (err) => controller.error(err))

      void (async () => {
        for (const line of voiceLines) {
          try {
            if (!line.audioUrl) continue

            _ulogInfo(`Downloading voice ${line.lineIndex}: ${line.audioUrl}`)
            const { data, storageKey } = await fetchBinaryByMediaValue(line.audioUrl)

            const safeSpeaker = sanitizeFilePart(line.speaker)
            const safeContent = sanitizeFilePart(line.content.replace(/\s+/g, '_'), 15)
            const extSource = storageKey || line.audioUrl
            const ext = extSource.endsWith('.wav') ? 'wav' : 'mp3'
            const fileName = `${String(line.lineIndex).padStart(3, '0')}_${safeSpeaker}_${safeContent}.${ext}`

            archive.append(data, { name: fileName })
            _ulogInfo(`Added ${fileName} to archive`)
          } catch (error) {
            _ulogError(`Failed to download voice line ${line.lineIndex}:`, error)
          }
        }

        await archive.finalize()
        _ulogInfo('Archive finalized')
      })()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(input.projectName)}_voices.zip"`,
    },
  })
}

export async function listNovelPromotionVideoUrls(input: {
  projectId: string
  projectName: string
  episodeId?: string | null
  panelPreferences?: Record<string, boolean>
}) {
  const videos = collectOrderedVideos(
    await loadEpisodesForMedia(input.projectId, input.episodeId),
    input.panelPreferences,
  )

  if (videos.length === 0) {
    throw new ApiError('NOT_FOUND')
  }

  return {
    projectName: input.projectName,
    videos: videos.map((video) => ({
      index: video.index,
      fileName: `${String(video.index).padStart(3, '0')}_${sanitizeFilePart(video.description)}.mp4`,
      videoUrl: `/api/novel-promotion/${input.projectId}/video-proxy?key=${encodeURIComponent(video.videoUrl)}`,
    })),
  }
}
