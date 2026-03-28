import { getProjectCostDetails, getUserCostSummary } from '@/lib/billing'
import { BILLING_CURRENCY } from '@/lib/billing/currency'
import { toMoneyNumber } from '@/lib/billing/money'
import { ApiError } from '@/lib/api-errors'
import { prisma } from '@engine/prisma'
import type { Prisma } from '@prisma/client'

const ACTION_KEY_PATTERN = /^[a-z][a-z0-9_]*$/

function extractActionFromDescription(description: string | null): string | null {
  if (!description) return null
  const cleaned = description.replace(/^\[SHADOW\]\s*/i, '').trim()
  const firstPart = cleaned.split(' - ')[0].trim()
  if (ACTION_KEY_PATTERN.test(firstPart)) return firstPart
  return null
}

export async function getProjectCostsPayload(input: {
  projectId: string
  userId: string
}) {
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    select: { userId: true, name: true },
  })

  if (!project) {
    throw new ApiError('NOT_FOUND')
  }

  if (project.userId !== input.userId) {
    throw new ApiError('FORBIDDEN')
  }

  const costDetails = await getProjectCostDetails(input.projectId)

  return {
    projectId: input.projectId,
    projectName: project.name,
    currency: BILLING_CURRENCY,
    ...costDetails,
  }
}

export async function getUserCostsPayload(userId: string) {
  const costSummary = await getUserCostSummary(userId)
  const projectIds = costSummary.byProject.map((item) => item.projectId)
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true },
  })

  const projectMap = new Map(projects.map((project) => [project.id, project.name]))
  const byProject = costSummary.byProject.map((item) => ({
    projectId: item.projectId,
    projectName: projectMap.get(item.projectId) || '未知项目',
    totalCost: item._sum.cost || 0,
    recordCount: item._count,
  }))

  return {
    userId,
    currency: BILLING_CURRENCY,
    total: costSummary.total,
    byProject: byProject.sort((a, b) => b.totalCost - a.totalCost),
  }
}

export async function getUserTransactionsPayload(input: {
  userId: string
  page: number
  pageSize: number
  type: string | null
  startDate: string | null
  endDate: string | null
}) {
  const where: Prisma.BalanceTransactionWhereInput = { userId: input.userId }
  if (input.type && input.type !== 'all') {
    where.type = input.type
  }

  if (input.startDate || input.endDate) {
    where.createdAt = {}
    if (input.startDate) {
      where.createdAt.gte = new Date(input.startDate)
    }
    if (input.endDate) {
      const endDateTime = new Date(input.endDate)
      endDateTime.setHours(23, 59, 59, 999)
      where.createdAt.lte = endDateTime
    }
  }

  const [transactionsRaw, total] = await Promise.all([
    prisma.balanceTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.balanceTransaction.count({ where }),
  ])

  const projectIds = [...new Set(transactionsRaw.map((item) => item.projectId).filter(Boolean) as string[])]
  const episodeIds = [...new Set(transactionsRaw.map((item) => item.episodeId).filter(Boolean) as string[])]

  const [projects, episodes] = await Promise.all([
    projectIds.length > 0
      ? prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, name: true },
      })
      : Promise.resolve([]),
    episodeIds.length > 0
      ? prisma.novelPromotionEpisode.findMany({
        where: { id: { in: episodeIds } },
        select: { id: true, episodeNumber: true, name: true },
      })
      : Promise.resolve([]),
  ])

  const projectMap = new Map(projects.map((project) => [project.id, project.name]))
  const episodeMap = new Map(episodes.map((episode) => [
    episode.id,
    { episodeNumber: episode.episodeNumber, name: episode.name },
  ]))

  const transactions = transactionsRaw.map((item) => {
    let billingMeta: Record<string, unknown> | null = null
    if (item.billingMeta && typeof item.billingMeta === 'string') {
      try {
        billingMeta = JSON.parse(item.billingMeta) as Record<string, unknown>
      } catch {}
    }

    return {
      ...item,
      amount: toMoneyNumber(item.amount),
      balanceAfter: toMoneyNumber(item.balanceAfter),
      action: item.taskType ?? extractActionFromDescription(item.description),
      projectName: item.projectId ? (projectMap.get(item.projectId) ?? null) : null,
      episodeNumber: item.episodeId ? (episodeMap.get(item.episodeId)?.episodeNumber ?? null) : null,
      episodeName: item.episodeId ? (episodeMap.get(item.episodeId)?.name ?? null) : null,
      billingMeta,
    }
  })

  return {
    currency: BILLING_CURRENCY,
    transactions,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.ceil(total / input.pageSize),
    },
  }
}
