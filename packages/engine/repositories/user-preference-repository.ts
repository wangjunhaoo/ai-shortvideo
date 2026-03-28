import { prisma } from '@engine/prisma'
import { composeModelKey, parseModelKeyStrict } from '@core/model-config-contract'

function normalizeModelKey(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = parseModelKeyStrict(trimmed)
  if (!parsed) return null
  return composeModelKey(parsed.provider, parsed.modelId)
}

export interface UserPreferenceRepository {
  getAnalysisModel(userId: string): Promise<string | null>
}

export const defaultUserPreferenceRepository: UserPreferenceRepository = {
  async getAnalysisModel(userId) {
    const userPreference = await prisma.userPreference.findUnique({
      where: { userId },
      select: { analysisModel: true },
    })
    return normalizeModelKey(userPreference?.analysisModel)
  },
}


