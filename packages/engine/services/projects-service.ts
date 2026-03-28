import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'
import { ApiError } from '@/lib/api-errors'
import { toMoneyNumber } from '@/lib/billing/money'
import { isArtStyleValue } from '@/lib/constants'
import { addSignedUrlsToProject, deleteObjects } from '@/lib/storage'
import { resolveStorageKeyFromMediaValue } from '@/lib/media/service'
import { attachMediaFieldsToProject } from '@/lib/media/attach'
import { logProjectAction } from '@/lib/logging/semantic'
import {
  collectProjectBailianManagedVoiceIds,
  cleanupUnreferencedBailianVoices,
} from '@/lib/providers/bailian'
import { isBillingFeatureEnabled } from '@/lib/runtime-mode'
import { prisma } from '@engine/prisma'

type ProjectPatchInput = Record<string, unknown>

function buildProjectSearchWhere(userId: string, search: string): Record<string, unknown> {
  const where: Record<string, unknown> = { userId }
  const trimmedSearch = search.trim()
  if (!trimmedSearch) return where

  // SQLite 的 LIKE 默认即大小写不敏感（ASCII 范围）
  where.OR = [
    { name: { contains: trimmedSearch } },
    { description: { contains: trimmedSearch } },
  ]

  return where
}

function sortProjectsByAccess<T extends {
  id: string
  lastAccessedAt: Date | null
  createdAt: Date
}>(projects: T[]): T[] {
  return [...projects].sort((a, b) => {
    if (!a.lastAccessedAt && !b.lastAccessedAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    if (!a.lastAccessedAt && b.lastAccessedAt) return -1
    if (a.lastAccessedAt && !b.lastAccessedAt) return 1
    return new Date(b.lastAccessedAt!).getTime() - new Date(a.lastAccessedAt!).getTime()
  })
}

async function ensureOwnedProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { user: true },
  })

  if (!project) {
    throw new ApiError('NOT_FOUND')
  }

  if (project.userId !== userId) {
    throw new ApiError('FORBIDDEN')
  }

  return project
}

async function collectProjectCOSKeys(projectId: string): Promise<string[]> {
  const keys: string[] = []

  const novelPromotion = await prisma.novelPromotionProject.findUnique({
    where: { projectId },
    include: {
      characters: {
        include: {
          appearances: true,
        },
      },
      locations: {
        include: {
          images: true,
        },
      },
      episodes: {
        include: {
          storyboards: {
            include: {
              panels: true,
            },
          },
        },
      },
    },
  })

  if (!novelPromotion) return keys

  for (const character of novelPromotion.characters) {
    for (const appearance of character.appearances) {
      const key = await resolveStorageKeyFromMediaValue(appearance.imageUrl)
      if (key) keys.push(key)
    }
  }

  for (const location of novelPromotion.locations) {
    for (const image of location.images) {
      const key = await resolveStorageKeyFromMediaValue(image.imageUrl)
      if (key) keys.push(key)
    }
  }

  for (const episode of novelPromotion.episodes) {
    const audioKey = await resolveStorageKeyFromMediaValue(episode.audioUrl)
    if (audioKey) keys.push(audioKey)

    for (const storyboard of episode.storyboards) {
      const storyboardKey = await resolveStorageKeyFromMediaValue(storyboard.storyboardImageUrl)
      if (storyboardKey) keys.push(storyboardKey)

      if (storyboard.candidateImages) {
        try {
          const candidates = JSON.parse(storyboard.candidateImages) as unknown[]
          for (const url of candidates) {
            const key = await resolveStorageKeyFromMediaValue(url)
            if (key) keys.push(key)
          }
        } catch {}
      }

      for (const panel of storyboard.panels) {
        const imageKey = await resolveStorageKeyFromMediaValue(panel.imageUrl)
        if (imageKey) keys.push(imageKey)

        const videoKey = await resolveStorageKeyFromMediaValue(panel.videoUrl)
        if (videoKey) keys.push(videoKey)
      }
    }
  }

  _ulogInfo(`[Project ${projectId}] 收集到 ${keys.length} 个 COS 文件待删除`)
  return keys
}

export async function listUserProjects(input: {
  userId: string
  page: number
  pageSize: number
  search: string
}) {
  const billingEnabled = isBillingFeatureEnabled()
  const { userId, page, pageSize, search } = input
  const where = buildProjectSearchWhere(userId, search)

  const [total, allProjects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const projects = sortProjectsByAccess(allProjects)
  const projectIds = projects.map((project) => project.id)

  const novelProjectsPromise = prisma.novelPromotionProject.findMany({
    where: { projectId: { in: projectIds } },
    select: {
      projectId: true,
      _count: {
        select: {
          episodes: true,
          characters: true,
          locations: true,
        },
      },
      episodes: {
        orderBy: { episodeNumber: 'asc' },
        select: {
          episodeNumber: true,
          novelText: true,
          storyboards: {
            select: {
              _count: {
                select: { panels: true },
              },
              panels: {
                where: {
                  OR: [
                    { imageUrl: { not: null } },
                    { videoUrl: { not: null } },
                  ],
                },
                select: {
                  imageUrl: true,
                  videoUrl: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const costMap = new Map<string, number>()
  if (billingEnabled && projectIds.length > 0) {
    const costsByProject = await prisma.usageCost.groupBy({
      by: ['projectId'],
      where: { projectId: { in: projectIds } },
      _sum: { cost: true },
    })

    for (const item of costsByProject) {
      costMap.set(item.projectId, toMoneyNumber(item._sum.cost))
    }
  }

  const novelProjects = await novelProjectsPromise
  const statsMap = new Map<string, {
    episodes: number
    images: number
    videos: number
    panels: number
    firstEpisodePreview: string | null
  }>(
    novelProjects.map((novelProject) => {
      let imageCount = 0
      let videoCount = 0
      let panelCount = 0
      for (const episode of novelProject.episodes) {
        for (const storyboard of episode.storyboards) {
          panelCount += storyboard._count.panels
          for (const panel of storyboard.panels) {
            if (panel.imageUrl) imageCount += 1
            if (panel.videoUrl) videoCount += 1
          }
        }
      }
      const firstEpisode = novelProject.episodes[0]
      const preview = firstEpisode?.novelText ? firstEpisode.novelText.slice(0, 100) : null
      return [novelProject.projectId, {
        episodes: novelProject._count.episodes,
        images: imageCount,
        videos: videoCount,
        panels: panelCount,
        firstEpisodePreview: preview,
      }]
    }),
  )

  const projectsWithStats = projects.map((project) => ({
    ...project,
    ...(billingEnabled ? { totalCost: costMap.get(project.id) ?? 0 } : {}),
    stats: statsMap.get(project.id) ?? {
      episodes: 0,
      images: 0,
      videos: 0,
      panels: 0,
      firstEpisodePreview: null,
    },
  }))

  return {
    projects: projectsWithStats,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

export async function createUserProject(input: {
  userId: string
  name: string
  description?: string | null
}) {
  const name = input.name
  const description = input.description

  if (!name || name.trim().length === 0) {
    throw new ApiError('INVALID_PARAMS')
  }
  if (name.length > 100) {
    throw new ApiError('INVALID_PARAMS')
  }
  if (description && description.length > 500) {
    throw new ApiError('INVALID_PARAMS')
  }

  const userPreference = await prisma.userPreference.findUnique({
    where: { userId: input.userId },
  })

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      mode: 'novel-promotion',
      userId: input.userId,
    },
  })

  await prisma.novelPromotionProject.create({
    data: {
      projectId: project.id,
      ...(userPreference && {
        analysisModel: userPreference.analysisModel,
        characterModel: userPreference.characterModel,
        locationModel: userPreference.locationModel,
        storyboardModel: userPreference.storyboardModel,
        editModel: userPreference.editModel,
        videoModel: userPreference.videoModel,
        audioModel: userPreference.audioModel,
        videoRatio: userPreference.videoRatio,
        artStyle: isArtStyleValue(userPreference.artStyle) ? userPreference.artStyle : 'american-comic',
        ttsRate: userPreference.ttsRate,
      }),
    },
  })

  return { project }
}

export async function getUserProjectDetail(input: {
  userId: string
  projectId: string
}) {
  const project = await ensureOwnedProject(input.projectId, input.userId)

  prisma.project.update({
    where: { id: input.projectId },
    data: { lastAccessedAt: new Date() },
  }).catch((error) => _ulogError('更新访问时间失败:', error))

  return {
    project: addSignedUrlsToProject(project),
  }
}

export async function updateUserProject(input: {
  userId: string
  userName?: string | null
  projectId: string
  data: ProjectPatchInput
}) {
  const project = await ensureOwnedProject(input.projectId, input.userId)

  const updatedProject = await prisma.project.update({
    where: { id: input.projectId },
    data: input.data,
  })

  logProjectAction(
    'UPDATE',
    input.userId,
    input.userName,
    input.projectId,
    updatedProject.name,
    { changes: input.data },
  )

  return { project: updatedProject }
}

export async function getUserProjectAssets(input: {
  userId: string
  projectId: string
}) {
  await ensureOwnedProject(input.projectId, input.userId)

  const novelPromotionData = await prisma.novelPromotionProject.findUnique({
    where: { projectId: input.projectId },
    include: {
      characters: {
        include: { appearances: { orderBy: { appearanceIndex: 'asc' } } },
        orderBy: { createdAt: 'asc' },
      },
      locations: {
        include: { images: { orderBy: { imageIndex: 'asc' } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!novelPromotionData) {
    throw new ApiError('NOT_FOUND')
  }

  const dataWithSignedUrls = await attachMediaFieldsToProject(novelPromotionData)

  return {
    characters: dataWithSignedUrls.characters || [],
    locations: dataWithSignedUrls.locations || [],
  }
}

export async function getUserProjectFullData(input: {
  userId: string
  projectId: string
}) {
  const project = await ensureOwnedProject(input.projectId, input.userId)

  prisma.project.update({
    where: { id: input.projectId },
    data: { lastAccessedAt: new Date() },
  }).catch((error) => _ulogError('更新访问时间失败:', error))

  const novelPromotionData = await prisma.novelPromotionProject.findUnique({
    where: { projectId: input.projectId },
    include: {
      episodes: {
        orderBy: { episodeNumber: 'asc' },
      },
      characters: {
        include: {
          appearances: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      locations: {
        include: {
          images: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!novelPromotionData) {
    throw new ApiError('NOT_FOUND')
  }

  const novelPromotionDataWithSignedUrls = await attachMediaFieldsToProject(novelPromotionData)

  return {
    project: {
      ...project,
      novelPromotionData: novelPromotionDataWithSignedUrls,
    },
  }
}

export async function deleteUserProject(input: {
  userId: string
  userName?: string | null
  projectId: string
}) {
  const project = await ensureOwnedProject(input.projectId, input.userId)

  _ulogInfo(`[DELETE] 开始删除项目: ${project.name} (${input.projectId})`)
  const projectVoiceIds = await collectProjectBailianManagedVoiceIds(input.projectId)
  const voiceCleanupResult = await cleanupUnreferencedBailianVoices({
    voiceIds: projectVoiceIds,
    scope: {
      userId: input.userId,
      excludeProjectId: input.projectId,
    },
  })
  const cosKeys = await collectProjectCOSKeys(input.projectId)

  let cosResult = { success: 0, failed: 0 }
  if (cosKeys.length > 0) {
    _ulogInfo(`[DELETE] 正在删除 ${cosKeys.length} 个 COS 文件...`)
    cosResult = await deleteObjects(cosKeys)
  }

  await prisma.project.delete({
    where: { id: input.projectId },
  })

  logProjectAction(
    'DELETE',
    input.userId,
    input.userName,
    input.projectId,
    project.name,
    {
      projectName: project.name,
      cosFilesDeleted: cosResult.success,
      cosFilesFailed: cosResult.failed,
      bailianVoicesDeleted: voiceCleanupResult.deletedVoiceIds.length,
      bailianVoicesSkippedReferenced: voiceCleanupResult.skippedReferencedVoiceIds.length,
    },
  )

  _ulogInfo(`[DELETE] 项目删除完成: ${project.name}`)
  _ulogInfo(`[DELETE] COS 文件: 成功 ${cosResult.success}, 失败 ${cosResult.failed}`)
  _ulogInfo(
    `[DELETE] Bailian 音色: 删除 ${voiceCleanupResult.deletedVoiceIds.length}, 跳过(仍被引用) ${voiceCleanupResult.skippedReferencedVoiceIds.length}`,
  )

  return {
    success: true,
    cosFilesDeleted: cosResult.success,
    cosFilesFailed: cosResult.failed,
    bailianVoicesDeleted: voiceCleanupResult.deletedVoiceIds.length,
    bailianVoicesSkippedReferenced: voiceCleanupResult.skippedReferencedVoiceIds.length,
  }
}
