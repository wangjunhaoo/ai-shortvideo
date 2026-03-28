import { logWarn as _ulogWarn } from '@/lib/logging/core'

export type ScreenplayContentItem =
  | { type: 'action'; text: string }
  | { type: 'dialogue'; character: string; lines: string }
  | { type: 'voiceover'; text: string }

export interface ScreenplayScene {
  scene_number?: number
  heading?: {
    int_ext?: string
    location?: string
    time?: string
  }
  description?: string
  content?: ScreenplayContentItem[]
}

export interface ScreenplayData {
  scenes: ScreenplayScene[]
}

export function parseScreenplay(value: string | null | undefined): ScreenplayData | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object') return null

    const scenes = (parsed as { scenes?: unknown }).scenes
    if (!Array.isArray(scenes)) return null

    return parsed as ScreenplayData
  } catch (error) {
    _ulogWarn('解析剧本JSON失败:', error)
    return null
  }
}

export function cloneScreenplay(screenplay: ScreenplayData): ScreenplayData {
  return JSON.parse(JSON.stringify(screenplay)) as ScreenplayData
}
