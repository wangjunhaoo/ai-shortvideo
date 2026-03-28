import { isErrorResponse, requireUserAuth } from '@engine/api-auth'
import { getUserModels } from '@engine/services/user-models-service'
import { getUserPreference, updateUserPreference } from '@engine/services/user-preference-service'

export async function handleUserModelsRequest() {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const payload = await getUserModels(session.user.id)
  return Response.json(payload)
}

export async function handleUserPreferenceRequest() {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const payload = await getUserPreference(session.user.id)
  return Response.json(payload)
}

export async function handleUpdateUserPreferenceRequest(request: Request) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = await request.json()
  const payload = await updateUserPreference(
    session.user.id,
    body as Record<string, unknown>,
  )
  return Response.json(payload)
}
