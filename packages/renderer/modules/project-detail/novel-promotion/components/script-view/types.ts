import type { TranslationValues } from '@renderer/modules/project-detail/detail-types'

export interface Clip {
  id: string
  clipIndex?: number
  summary: string
  content: string
  screenplay?: string | null
  characters: string | null
  location: string | null
}

export interface Panel {
  panelIndex: number
  characters?: string | null
  location?: string | null
}

export interface Storyboard {
  id: string
  clipId?: string
  panels?: Panel[]
}

export interface ScriptViewProps {
  projectId: string
  episodeId?: string
  clips: Clip[]
  storyboards?: Storyboard[]
  onClipEdit?: (clipId: string) => void
  onClipUpdate?: (clipId: string, data: Partial<Clip>) => void
  onClipDelete?: (clipId: string) => void
  onGenerateStoryboard?: () => void
  isSubmittingStoryboardBuild?: boolean
  assetsLoading?: boolean
  onOpenAssetLibrary?: () => void
}

export function toTranslationValues(values?: Record<string, unknown>): TranslationValues | undefined {
  return values as TranslationValues | undefined
}
