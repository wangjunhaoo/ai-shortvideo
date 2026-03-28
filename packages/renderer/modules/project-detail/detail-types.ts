export type TranslationValues = Record<string, string | number | Date>
export type TranslationFn = (key: string, values?: TranslationValues) => string

export const VALID_STAGES = ['config', 'script', 'assets', 'text-storyboard', 'storyboard', 'videos', 'voice', 'editor'] as const
export type Stage = typeof VALID_STAGES[number]

export interface Episode {
  id: string
  episodeNumber: number
  name: string
  description?: string | null
  novelText?: string | null
  audioUrl?: string | null
  srtContent?: string | null
  createdAt: string
}

export type NovelPromotionData = {
  episodes?: Episode[]
  importStatus?: string
}
