'use client'

import type { ActingCharacter, PhotographyRules } from './AIDataModal.types'

interface BuildAIDataPreviewJsonParams {
  videoRatio: string
  shotType: string
  cameraMove: string
  description: string
  location: string | null
  characters: string[]
  videoPrompt: string
  photographyRules: PhotographyRules | null
  actingNotes: ActingCharacter[]
}

export function buildAIDataPreviewJson({
  videoRatio,
  shotType,
  cameraMove,
  description,
  location,
  characters,
  videoPrompt,
  photographyRules,
  actingNotes,
}: BuildAIDataPreviewJsonParams) {
  return {
    aspect_ratio: videoRatio,
    shot: {
      shot_type: shotType,
      camera_move: cameraMove,
      description,
      location,
      characters,
      prompt_text: `A ${videoRatio} shot: ${description}. ${videoPrompt}`,
    },
    ...(photographyRules ? { photography_rules: photographyRules } : {}),
    ...(actingNotes.length > 0 ? { acting_notes: actingNotes } : {}),
  }
}
