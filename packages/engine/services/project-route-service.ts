import { ApiError } from '@/lib/api-errors'
import { getBillingFeatureDisabledResponse } from '@/lib/desktop-feature-guards'
import { isErrorResponse, requireUserAuth } from '@engine/api-auth'
import { getProjectCostsPayload } from '@engine/services/billing-query-service'
import {
  createUserProject,
  deleteUserProject,
  getUserProjectAssets,
  getUserProjectDetail,
  getUserProjectFullData,
  listUserProjects,
  updateUserProject,
} from '@engine/services/projects-service'

function readPage(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || `${fallback}`, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

function readProjectPayloadName(value: unknown) {
  if (typeof value !== 'string') return ''
  return value
}

function readProjectPayloadDescription(value: unknown) {
  if (typeof value !== 'string') return undefined
  return value
}

export async function handleListProjectsRequest(request: Request) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const payload = await listUserProjects({
    userId: session.user.id,
    page: readPage(searchParams.get('page'), 1, 1, 10_000),
    pageSize: readPage(searchParams.get('pageSize'), 12, 1, 200),
    search: searchParams.get('search') || '',
  })

  return Response.json(payload)
}

export async function handleCreateProjectRequest(request: Request) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = await request.json()
  const name = readProjectPayloadName((body as Record<string, unknown>)?.name)
  const description = readProjectPayloadDescription((body as Record<string, unknown>)?.description)

  if (!name || name.trim().length === 0) {
    throw new ApiError('INVALID_PARAMS')
  }
  if (name.length > 100) {
    throw new ApiError('INVALID_PARAMS')
  }
  if (description && description.length > 500) {
    throw new ApiError('INVALID_PARAMS')
  }

  const payload = await createUserProject({
    userId: session.user.id,
    name,
    description,
  })

  return Response.json(payload, { status: 201 })
}

export async function handleProjectDetailRequest(projectId: string) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const payload = await getUserProjectDetail({
    userId: session.user.id,
    projectId,
  })

  return Response.json(payload)
}

export async function handleProjectUpdateRequest(
  request: Request,
  projectId: string,
) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult
  const body = await request.json()

  const payload = await updateUserProject({
    userId: session.user.id,
    userName: session.user.name,
    projectId,
    data: body as Record<string, unknown>,
  })

  return Response.json(payload)
}

export async function handleProjectDeleteRequest(projectId: string) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const payload = await deleteUserProject({
    userId: session.user.id,
    userName: session.user.name,
    projectId,
  })

  return Response.json(payload)
}

export async function handleProjectFullDataRequest(projectId: string) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const payload = await getUserProjectFullData({
    userId: session.user.id,
    projectId,
  })

  return Response.json(payload)
}

export async function handleProjectAssetsRequest(projectId: string) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const payload = await getUserProjectAssets({
    userId: session.user.id,
    projectId,
  })

  return Response.json(payload)
}

export async function handleProjectCostsRequest(projectId: string) {
  const billingDisabledResponse = getBillingFeatureDisabledResponse()
  if (billingDisabledResponse) return billingDisabledResponse

  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const payload = await getProjectCostsPayload({
    projectId,
    userId: session.user.id,
  })

  return Response.json(payload)
}
