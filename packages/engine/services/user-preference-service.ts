import { ApiError } from '@/lib/api-errors'
import { isArtStyleValue } from '@/lib/constants'
import { prisma } from '@engine/prisma'

const USER_PREFERENCE_ALLOWED_FIELDS = [
  'analysisModel',
  'characterModel',
  'locationModel',
  'storyboardModel',
  'editModel',
  'videoModel',
  'audioModel',
  'lipSyncModel',
  'videoRatio',
  'artStyle',
  'ttsRate',
] as const

type UserPreferenceAllowedField = (typeof USER_PREFERENCE_ALLOWED_FIELDS)[number]
type UpdateUserPreferenceInput = Record<string, unknown>

function validateArtStyleField(value: unknown): string {
  if (typeof value !== 'string') {
    throw new ApiError('INVALID_PARAMS', {
      code: 'INVALID_ART_STYLE',
      field: 'artStyle',
      message: 'artStyle must be a supported value',
    })
  }

  const artStyle = value.trim()
  if (!isArtStyleValue(artStyle)) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'INVALID_ART_STYLE',
      field: 'artStyle',
      message: 'artStyle must be a supported value',
    })
  }

  return artStyle
}

function buildUserPreferenceUpdateData(body: UpdateUserPreferenceInput): Record<string, unknown> {
  const updateData: Record<string, unknown> = {}

  for (const field of USER_PREFERENCE_ALLOWED_FIELDS) {
    if (body[field] === undefined) continue

    if (field === 'artStyle') {
      updateData[field] = validateArtStyleField(body[field])
      continue
    }

    updateData[field] = body[field]
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError('INVALID_PARAMS')
  }

  return updateData
}

export async function getUserPreference(userId: string) {
  const preference = await prisma.userPreference.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })

  return { preference }
}

export async function updateUserPreference(userId: string, body: UpdateUserPreferenceInput) {
  const updateData = buildUserPreferenceUpdateData(body)

  const preference = await prisma.userPreference.upsert({
    where: { userId },
    update: updateData,
    create: {
      userId,
      ...updateData,
    },
  })

  return { preference }
}
