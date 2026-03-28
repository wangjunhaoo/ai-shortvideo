import { getRequestId } from '@/lib/api-errors'
import { sanitizeImageInputsForTaskPayload } from '@/lib/media/outbound-image'
import { resolveRequiredTaskLocale } from '@/lib/task/resolve-locale'
import { isErrorResponse, requireProjectAuthLight } from '@engine/api-auth'
import {
  submitNovelPromotionGenerateCharacterImageTask,
  submitNovelPromotionGenerateImageTask,
  submitNovelPromotionModifyAssetImageTask,
  submitNovelPromotionModifyStoryboardImageTask,
  submitNovelPromotionRegenerateGroupTask,
  submitNovelPromotionRegenerateSingleImageTask,
} from '@engine/services/novel-promotion-image-task-service'
import { submitNovelPromotionPanelVariantTask } from '@engine/services/novel-promotion-panel-variant-service'
import {
  submitNovelPromotionInsertPanelTask,
  submitNovelPromotionRegeneratePanelImageTask,
  submitNovelPromotionRegenerateStoryboardTextTask,
  submitNovelPromotionVoiceDesignTask,
} from '@engine/services/novel-promotion-task-submit-service'
import { submitNovelPromotionGenerateVideoTask } from '@engine/services/novel-promotion-video-task-service'
import {
  submitNovelPromotionLipSyncTask,
  submitNovelPromotionVoiceGenerateTask,
} from '@engine/services/novel-promotion-voice-service'

async function requireNovelPromotionProjectSession(projectId: string) {
  const authResult = await requireProjectAuthLight(projectId)
  if (isErrorResponse(authResult)) return authResult
  return authResult.session
}

export async function handleNovelPromotionGenerateImageRequest(
  request: Request,
  projectId: string,
) {
  const session = await requireNovelPromotionProjectSession(projectId)
  if (session instanceof Response) return session

  const body = await request.json().catch(() => ({}))
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitNovelPromotionGenerateImageTask({
    projectId,
    userId: session.user.id,
    requestId: getRequestId(request),
    locale,
    body,
  })
  return Response.json(result)
}

export async function handleNovelPromotionGenerateCharacterImageRequest(
  request: Request,
  projectId: string,
) {
  const session = await requireNovelPromotionProjectSession(projectId)
  if (session instanceof Response) return session

  const body = await request.json().catch(() => ({}))
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitNovelPromotionGenerateCharacterImageTask({
    projectId,
    userId: session.user.id,
    requestId: getRequestId(request),
    locale,
    body,
  })
  return Response.json(result)
}

export async function handleNovelPromotionModifyAssetImageRequest(
  request: Request,
  projectId: string,
) {
  const session = await requireNovelPromotionProjectSession(projectId)
  if (session instanceof Response) return session

  const body = await request.json()
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitNovelPromotionModifyAssetImageTask({
    projectId,
    userId: session.user.id,
    requestId: getRequestId(request),
    locale,
    body,
    sanitizeImageInputsForTaskPayload,
  })
  return Response.json(result)
}

export async function handleNovelPromotionModifyStoryboardImageRequest(
  request: Request,
  projectId: string,
) {
  const session = await requireNovelPromotionProjectSession(projectId)
  if (session instanceof Response) return session

  const body = await request.json()
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitNovelPromotionModifyStoryboardImageTask({
    projectId,
    userId: session.user.id,
    requestId: getRequestId(request),
    locale,
    body,
    sanitizeImageInputsForTaskPayload,
  })
  return Response.json(result)
}

export async function handleNovelPromotionRegenerateGroupRequest(
  request: Request,
  projectId: string,
) {
  const session = await requireNovelPromotionProjectSession(projectId)
  if (session instanceof Response) return session

  const body = await request.json()
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitNovelPromotionRegenerateGroupTask({
    projectId,
    userId: session.user.id,
    requestId: getRequestId(request),
    locale,
    body,
  })
  return Response.json(result)
}

export async function handleNovelPromotionRegenerateSingleImageRequest(
  request: Request,
  projectId: string,
) {
  const session = await requireNovelPromotionProjectSession(projectId)
  if (session instanceof Response) return session

  const body = await request.json()
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitNovelPromotionRegenerateSingleImageTask({
    projectId,
    userId: session.user.id,
    requestId: getRequestId(request),
    locale,
    body,
  })
  return Response.json(result)
}

export async function handleNovelPromotionRegeneratePanelImageRequest(
  request: Request,
  projectId: string,
) {
  const session = await requireNovelPromotionProjectSession(projectId)
  if (session instanceof Response) return session

  const body = await request.json()
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitNovelPromotionRegeneratePanelImageTask({
    projectId,
    userId: session.user.id,
    requestId: getRequestId(request),
    locale,
    body,
  })
  return Response.json(result)
}

export async function handleNovelPromotionRegenerateStoryboardTextRequest(
  request: Request,
  projectId: string,
) {
  const session = await requireNovelPromotionProjectSession(projectId)
  if (session instanceof Response) return session

  const body = await request.json()
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitNovelPromotionRegenerateStoryboardTextTask({
    projectId,
    userId: session.user.id,
    requestId: getRequestId(request),
    locale,
    body,
  })
  return Response.json(result)
}

export async function handleNovelPromotionInsertPanelRequest(
  request: Request,
  projectId: string,
) {
  const session = await requireNovelPromotionProjectSession(projectId)
  if (session instanceof Response) return session

  const body = await request.json()
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitNovelPromotionInsertPanelTask({
    projectId,
    userId: session.user.id,
    requestId: getRequestId(request),
    locale,
    body,
  })
  return Response.json(result)
}

export async function handleNovelPromotionVoiceDesignRequest(
  request: Request,
  projectId: string,
) {
  const session = await requireNovelPromotionProjectSession(projectId)
  if (session instanceof Response) return session

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitNovelPromotionVoiceDesignTask({
    projectId,
    userId: session.user.id,
    requestId: getRequestId(request),
    locale,
    body,
  })
  return Response.json(result)
}

export async function handleNovelPromotionVoiceGenerateRequest(
  request: Request,
  projectId: string,
) {
  const session = await requireNovelPromotionProjectSession(projectId)
  if (session instanceof Response) return session

  const body = await request.json().catch(() => null)
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitNovelPromotionVoiceGenerateTask({
    projectId,
    userId: session.user.id,
    requestId: getRequestId(request),
    locale,
    body,
  })
  return Response.json(result)
}

export async function handleNovelPromotionLipSyncRequest(
  request: Request,
  projectId: string,
) {
  const session = await requireNovelPromotionProjectSession(projectId)
  if (session instanceof Response) return session

  const body = await request.json()
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitNovelPromotionLipSyncTask({
    projectId,
    userId: session.user.id,
    requestId: getRequestId(request),
    locale,
    body,
  })
  return Response.json(result)
}

export async function handleNovelPromotionGenerateVideoRequest(
  request: Request,
  projectId: string,
) {
  const session = await requireNovelPromotionProjectSession(projectId)
  if (session instanceof Response) return session

  const body = await request.json()
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitNovelPromotionGenerateVideoTask({
    projectId,
    userId: session.user.id,
    requestId: getRequestId(request),
    locale,
    body,
  })
  return Response.json(result)
}

export async function handleNovelPromotionPanelVariantRequest(
  request: Request,
  projectId: string,
) {
  const session = await requireNovelPromotionProjectSession(projectId)
  if (session instanceof Response) return session

  const body = await request.json()
  const locale = resolveRequiredTaskLocale(request, body)
  const result = await submitNovelPromotionPanelVariantTask({
    projectId,
    userId: session.user.id,
    requestId: getRequestId(request),
    locale,
    body,
  })
  return Response.json(result)
}
