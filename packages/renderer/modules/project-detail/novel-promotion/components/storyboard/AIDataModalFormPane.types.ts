'use client'

import type {
  ActingCharacter,
  PhotographyCharacter,
  PhotographyRules,
} from './AIDataModal.types'

export interface AIDataModalFormPaneProps {
  basicSectionLabels: AIDataModalBasicSectionLabels
  photographySectionLabels: AIDataModalPhotographySectionLabels
  actingSectionLabels: AIDataModalActingSectionLabels
  shotType: string
  cameraMove: string
  description: string
  location: string | null
  characters: string[]
  videoPrompt: string
  photographyRules: PhotographyRules | null
  actingNotes: ActingCharacter[]
  onShotTypeChange: (value: string) => void
  onCameraMoveChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onVideoPromptChange: (value: string) => void
  onPhotographyFieldChange: (path: string, value: string) => void
  onPhotographyCharacterChange: (
    index: number,
    field: keyof PhotographyCharacter,
    value: string,
  ) => void
  onActingCharacterChange: (
    index: number,
    field: keyof ActingCharacter,
    value: string,
  ) => void
}

export interface AIDataModalBasicSectionLabels {
  title: string
  shotType: string
  shotTypePlaceholder: string
  cameraMove: string
  cameraMovePlaceholder: string
  scene: string
  notSelected: string
  characters: string
  none: string
  visualDescription: string
  visualDescriptionPlaceholder: string
  videoPrompt: string
  videoPromptPlaceholder: string
}

export interface AIDataModalBasicSectionProps {
  labels: AIDataModalBasicSectionLabels
  shotType: string
  cameraMove: string
  description: string
  location: string | null
  characters: string[]
  videoPrompt: string
  onShotTypeChange: (value: string) => void
  onCameraMoveChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onVideoPromptChange: (value: string) => void
}

export interface AIDataModalPhotographySectionLabels {
  title: string
  summary: string
  lightingDirection: string
  lightingQuality: string
  depthOfField: string
  colorTone: string
  characterPosition: string
  position: string
  posture: string
  facing: string
}

export interface AIDataModalPhotographySectionProps {
  labels: AIDataModalPhotographySectionLabels
  photographyRules: PhotographyRules | null
  onPhotographyFieldChange: (path: string, value: string) => void
  onPhotographyCharacterChange: (
    index: number,
    field: keyof PhotographyCharacter,
    value: string,
  ) => void
}

export interface AIDataModalActingSectionLabels {
  title: string
  actingDescription: string
}

export interface AIDataModalActingSectionProps {
  labels: AIDataModalActingSectionLabels
  actingNotes: ActingCharacter[]
  onActingCharacterChange: (
    index: number,
    field: keyof ActingCharacter,
    value: string,
  ) => void
}
