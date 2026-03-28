'use client'

export interface ScreenplaySceneContentItem {
  type: 'action' | 'dialogue' | 'voiceover'
  text?: string
  character?: string
  lines?: string
  parenthetical?: string
}

export interface ScreenplayScene {
  scene_number: number
  heading:
    | {
        int_ext: string
        location: string
        time: string
      }
    | string
  description?: string
  characters?: string[]
  content: ScreenplaySceneContentItem[]
}

export interface Screenplay {
  clip_id: string
  original_text?: string
  scenes: ScreenplayScene[]
}

export interface ScreenplayDisplayLabels {
  tabs: {
    formatted: string
    original: string
  }
  scene: {
    formatSceneLabel: (number: number) => string
    charactersLabel: string
    voiceoverLabel: string
  }
  parseFailedTitle: string
  parseFailedDescription: string
}

export interface ScreenplayDisplayProps {
  screenplay: string | null
  originalContent: string
  labels: ScreenplayDisplayLabels
}

export type ScreenplayDisplayTab = 'screenplay' | 'original'
