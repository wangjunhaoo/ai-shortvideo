import { ApiError } from '@/lib/api-errors'
import { maybeSubmitLLMTask } from '@/lib/llm-observe/route-task'
import { TASK_TYPE } from '@/lib/task/types'
import { prisma } from '@engine/prisma'

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

export async function submitAssetHubAiModifyCharacter(input: {
  request: Request
  userId: string
  body: unknown
}) {
  const body = toObject(input.body)
  const characterId = typeof body.characterId === 'string' ? body.characterId : ''
  const appearanceIndex = body.appearanceIndex
  const currentDescription = typeof body.currentDescription === 'string' ? body.currentDescription : ''
  const modifyInstruction = typeof body.modifyInstruction === 'string' ? body.modifyInstruction : ''

  if (!characterId || appearanceIndex === undefined || !currentDescription || !modifyInstruction) {
    throw new ApiError('INVALID_PARAMS')
  }

  const character = await prisma.globalCharacter.findUnique({
    where: { id: characterId },
    select: { id: true, userId: true },
  })
  if (!character || character.userId !== input.userId) {
    throw new ApiError('NOT_FOUND')
  }

  const asyncTaskResponse = await maybeSubmitLLMTask({
    request: input.request,
    userId: input.userId,
    projectId: 'global-asset-hub',
    type: TASK_TYPE.ASSET_HUB_AI_MODIFY_CHARACTER,
    targetType: 'GlobalCharacter',
    targetId: characterId,
    routePath: '/api/asset-hub/ai-modify-character',
    body: { characterId, appearanceIndex, currentDescription, modifyInstruction },
    dedupeKey: `asset_hub_ai_modify_character:${characterId}:${appearanceIndex}`,
  })
  if (asyncTaskResponse) {
    return asyncTaskResponse
  }

  throw new ApiError('INVALID_PARAMS')
}

export async function submitAssetHubAiModifyLocation(input: {
  request: Request
  userId: string
  body: unknown
}) {
  const body = toObject(input.body)
  const locationId = typeof body.locationId === 'string' ? body.locationId : ''
  const imageIndex = body.imageIndex
  const currentDescription = typeof body.currentDescription === 'string' ? body.currentDescription : ''
  const modifyInstruction = typeof body.modifyInstruction === 'string' ? body.modifyInstruction : ''

  if (!locationId || imageIndex === undefined || !currentDescription || !modifyInstruction) {
    throw new ApiError('INVALID_PARAMS')
  }

  const location = await prisma.globalLocation.findUnique({
    where: { id: locationId },
    select: { id: true, userId: true, name: true },
  })
  if (!location || location.userId !== input.userId) {
    throw new ApiError('NOT_FOUND')
  }

  const asyncTaskResponse = await maybeSubmitLLMTask({
    request: input.request,
    userId: input.userId,
    projectId: 'global-asset-hub',
    type: TASK_TYPE.ASSET_HUB_AI_MODIFY_LOCATION,
    targetType: 'GlobalLocation',
    targetId: locationId,
    routePath: '/api/asset-hub/ai-modify-location',
    body: {
      locationId,
      locationName: location.name,
      imageIndex,
      currentDescription,
      modifyInstruction,
    },
    dedupeKey: `asset_hub_ai_modify_location:${locationId}:${imageIndex}`,
  })
  if (asyncTaskResponse) {
    return asyncTaskResponse
  }

  throw new ApiError('INVALID_PARAMS')
}

