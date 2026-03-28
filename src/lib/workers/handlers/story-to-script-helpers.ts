import { removeLocationPromptSuffix } from '@/lib/constants'
import type { StoryToScriptClipCandidate } from '@/lib/novel-promotion/story-to-script/orchestrator'
import type { ProjectRepository } from '@engine/repositories/project-repository'

export type AnyObj = Record<string, unknown>

export function parseEffort(value: unknown): 'minimal' | 'low' | 'medium' | 'high' | null {
  if (value === 'minimal' || value === 'low' || value === 'medium' || value === 'high') return value
  return null
}

export function parseTemperature(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0.7
  return Math.max(0, Math.min(2, value))
}

export function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

export function resolveClipRecordId(clipMap: Map<string, string>, clipId: string): string | null {
  return clipMap.get(clipId) || null
}

export async function persistAnalyzedCharacters(params: {
  projectRepository: ProjectRepository
  projectInternalId: string
  existingNames: Set<string>
  analyzedCharacters: Record<string, unknown>[]
}) {
  const created: Array<{ id: string; name: string }> = []

  for (const item of params.analyzedCharacters) {
    const name = asString(item.name).trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (params.existingNames.has(key)) continue

    const profileData = {
      role_level: item.role_level,
      archetype: item.archetype,
      personality_tags: toStringArray(item.personality_tags),
      era_period: item.era_period,
      social_class: item.social_class,
      occupation: item.occupation,
      costume_tier: item.costume_tier,
      suggested_colors: toStringArray(item.suggested_colors),
      primary_identifier: item.primary_identifier,
      visual_keywords: toStringArray(item.visual_keywords),
      gender: item.gender,
      age_range: item.age_range,
    }

    const createdRow = await params.projectRepository.createNovelCharacter({
      novelPromotionProjectId: params.projectInternalId,
      name,
      aliases: toStringArray(item.aliases),
      introduction: asString(item.introduction) || undefined,
      profileData,
      profileConfirmed: false,
    })

    params.existingNames.add(key)
    created.push({ id: createdRow.id, name })
  }

  return created
}

export async function persistAnalyzedLocations(params: {
  projectRepository: ProjectRepository
  projectInternalId: string
  existingNames: Set<string>
  analyzedLocations: Record<string, unknown>[]
}) {
  const created: Array<{ id: string; name: string }> = []
  const invalidKeywords = ['幻想', '抽象', '无明确', '空间锚点', '未说明', '不明确']

  for (const item of params.analyzedLocations) {
    const name = asString(item.name).trim()
    if (!name) continue

    const descriptions = toStringArray(item.descriptions)
    const mergedDescriptions = descriptions.length > 0
      ? descriptions
      : (asString(item.description) ? [asString(item.description)] : [])

    const firstDescription = mergedDescriptions[0] || ''
    const isInvalid = invalidKeywords.some((keyword) =>
      name.includes(keyword) || firstDescription.includes(keyword),
    )
    if (isInvalid) continue

    const key = name.toLowerCase()
    if (params.existingNames.has(key)) continue

    const location = await params.projectRepository.createNovelLocation({
      novelPromotionProjectId: params.projectInternalId,
      name,
      summary: asString(item.summary) || null,
    })

    const cleanDescriptions = mergedDescriptions.map((desc) => removeLocationPromptSuffix(desc || ''))
    for (let i = 0; i < cleanDescriptions.length; i += 1) {
      await params.projectRepository.createLocationImage({
        locationId: location.id,
        imageIndex: i,
        description: cleanDescriptions[i],
      })
    }

    params.existingNames.add(key)
    created.push({ id: location.id, name })
  }

  return created
}

export async function persistClips(params: {
  projectRepository: ProjectRepository
  episodeId: string
  clipList: StoryToScriptClipCandidate[]
}) {
  const rows = await params.projectRepository.saveClipsForEpisode(
    params.episodeId,
    params.clipList.map((clip) => ({
      startText: clip.startText,
      endText: clip.endText,
      summary: clip.summary,
      location: clip.location,
      characters: clip.characters,
      content: clip.content,
    })),
  )
  return rows.map((row, index) => ({
    id: row.id,
    clipKey: params.clipList[index]?.id || row.id,
  }))
}

