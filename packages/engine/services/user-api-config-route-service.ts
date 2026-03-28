import { ApiError } from '@/lib/api-errors'
import { getProviderKey } from '@/lib/api-config'
import { testLlmConnection } from '@/lib/user-api/llm-test-connection'
import { probeModelLlmProtocol } from '@/lib/user-api/model-llm-protocol-probe'
import {
  probeMediaTemplate,
  validateOpenAICompatMediaTemplate,
} from '@/lib/user-api/model-template'
import { testProviderConnection } from '@/lib/user-api/provider-test'
import { isErrorResponse, requireUserAuth } from '@engine/api-auth'
import { getUserApiConfig, updateUserApiConfig } from '@engine/services/user-api-config-service'

type ProbeRequestBody = {
  providerId?: unknown
  modelId?: unknown
}

type MediaTemplateProbeBody = {
  providerId?: unknown
  modelId?: unknown
  template?: unknown
  samplePrompt?: unknown
  sampleImage?: unknown
}

type ValidateMediaTemplateBody = {
  providerId?: unknown
  template?: unknown
}

function readRequiredString(value: unknown, field: string, code: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ApiError('INVALID_PARAMS', { code, field })
  }
  return value.trim()
}

export async function handleGetUserApiConfigRequest() {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const payload = await getUserApiConfig(session.user.id)
  return Response.json(payload)
}

export async function handleUpdateUserApiConfigRequest(request: Request) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new ApiError('INVALID_PARAMS', {
      code: 'BODY_PARSE_FAILED',
      field: 'body',
    })
  }

  const payload = await updateUserApiConfig(session.user.id, body as never)
  return Response.json(payload)
}

export async function handleTestApiConfigConnectionRequest(request: Request) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult

  const body = await request.json().catch(() => ({}))
  const startedAt = Date.now()
  const result = await testLlmConnection(body)
  return Response.json({
    success: true,
    latencyMs: Date.now() - startedAt,
    ...result,
  })
}

export async function handleTestProviderConnectionRequest(request: Request) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult

  const body = await request.json().catch(() => ({}))
  const startedAt = Date.now()
  const result = await testProviderConnection(body)
  return Response.json({
    ...result,
    latencyMs: Date.now() - startedAt,
  })
}

export async function handleProbeModelLlmProtocolRequest(request: Request) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult

  let body: ProbeRequestBody
  try {
    body = (await request.json()) as ProbeRequestBody
  } catch {
    throw new ApiError('INVALID_PARAMS', {
      code: 'BODY_PARSE_FAILED',
      field: 'body',
    })
  }

  const providerId = readRequiredString(
    body.providerId,
    'providerId',
    'MODEL_LLM_PROTOCOL_PROBE_INVALID',
  )
  const modelId = readRequiredString(
    body.modelId,
    'modelId',
    'MODEL_LLM_PROTOCOL_PROBE_INVALID',
  )

  if (getProviderKey(providerId) !== 'openai-compatible') {
    throw new ApiError('INVALID_PARAMS', {
      code: 'MODEL_LLM_PROTOCOL_PROBE_PROVIDER_INVALID',
      field: 'providerId',
    })
  }

  const result = await probeModelLlmProtocol({
    userId: authResult.session.user.id,
    providerId,
    modelId,
  })

  return Response.json(result)
}

export async function handleProbeMediaTemplateRequest(request: Request) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult

  let body: MediaTemplateProbeBody
  try {
    body = (await request.json()) as MediaTemplateProbeBody
  } catch {
    throw new ApiError('INVALID_PARAMS', {
      code: 'BODY_PARSE_FAILED',
      field: 'body',
    })
  }

  const providerId = readRequiredString(
    body.providerId,
    'providerId',
    'MODEL_TEMPLATE_PROBE_INVALID',
  )
  const modelId = readRequiredString(
    body.modelId,
    'modelId',
    'MODEL_TEMPLATE_PROBE_INVALID',
  )

  if (getProviderKey(providerId) !== 'openai-compatible') {
    throw new ApiError('INVALID_PARAMS', {
      code: 'MODEL_TEMPLATE_PROBE_PROVIDER_INVALID',
      field: 'providerId',
    })
  }

  const validated = validateOpenAICompatMediaTemplate(body.template)
  if (!validated.ok || !validated.template) {
    return Response.json({
      success: false,
      verified: false,
      code: 'MODEL_TEMPLATE_INVALID',
      issues: validated.issues,
    })
  }

  const samplePrompt = typeof body.samplePrompt === 'string' ? body.samplePrompt.trim() : undefined
  const sampleImage = typeof body.sampleImage === 'string' ? body.sampleImage.trim() : undefined

  const result = await probeMediaTemplate({
    userId: authResult.session.user.id,
    providerId,
    modelId,
    template: validated.template,
    ...(samplePrompt ? { samplePrompt } : {}),
    ...(sampleImage ? { sampleImage } : {}),
  })

  return Response.json(result)
}

export async function handleValidateMediaTemplateRequest(request: Request) {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult

  let body: ValidateMediaTemplateBody
  try {
    body = (await request.json()) as ValidateMediaTemplateBody
  } catch {
    throw new ApiError('INVALID_PARAMS', {
      code: 'BODY_PARSE_FAILED',
      field: 'body',
    })
  }

  const providerId = readRequiredString(
    body.providerId,
    'providerId',
    'MODEL_TEMPLATE_INVALID',
  )
  if (getProviderKey(providerId) !== 'openai-compatible') {
    throw new ApiError('INVALID_PARAMS', {
      code: 'MODEL_TEMPLATE_PROVIDER_INVALID',
      field: 'providerId',
    })
  }

  const result = validateOpenAICompatMediaTemplate(body.template)
  return Response.json({
    success: result.ok,
    ...(result.template ? { template: result.template } : {}),
    issues: result.issues,
  })
}
