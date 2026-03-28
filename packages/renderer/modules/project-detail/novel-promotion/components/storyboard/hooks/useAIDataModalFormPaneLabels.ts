'use client'

import { useMemo } from 'react'
import type {
  AIDataModalActingSectionLabels,
  AIDataModalBasicSectionLabels,
  AIDataModalPhotographySectionLabels,
} from '../AIDataModalFormPane.types'

interface UseAIDataModalFormPaneLabelsParams {
  t: (key: string, values?: Record<string, unknown>) => string
}

export function useAIDataModalFormPaneLabels({
  t,
}: UseAIDataModalFormPaneLabelsParams) {
  const basicSectionLabels = useMemo<AIDataModalBasicSectionLabels>(
    () => ({
      title: t('aiData.basicData'),
      shotType: t('aiData.shotType'),
      shotTypePlaceholder: t('aiData.shotTypePlaceholder'),
      cameraMove: t('aiData.cameraMove'),
      cameraMovePlaceholder: t('aiData.cameraMovePlaceholder'),
      scene: t('aiData.scene'),
      notSelected: t('aiData.notSelected'),
      characters: t('aiData.characters'),
      none: t('common.none'),
      visualDescription: t('aiData.visualDescription'),
      visualDescriptionPlaceholder: t('insert.placeholder.description'),
      videoPrompt: t('aiData.videoPrompt'),
      videoPromptPlaceholder: t('panel.videoPromptPlaceholder'),
    }),
    [t],
  )

  const photographySectionLabels = useMemo<AIDataModalPhotographySectionLabels>(
    () => ({
      title: t('aiData.photographyRules'),
      summary: t('aiData.summary'),
      lightingDirection: t('aiData.lightingDirection'),
      lightingQuality: t('aiData.lightingQuality'),
      depthOfField: t('aiData.depthOfField'),
      colorTone: t('aiData.colorTone'),
      characterPosition: t('aiData.characterPosition'),
      position: t('aiData.position'),
      posture: t('aiData.posture'),
      facing: t('aiData.facing'),
    }),
    [t],
  )

  const actingSectionLabels = useMemo<AIDataModalActingSectionLabels>(
    () => ({
      title: t('aiData.actingNotes'),
      actingDescription: t('aiData.actingDescription'),
    }),
    [t],
  )

  return {
    basicSectionLabels,
    photographySectionLabels,
    actingSectionLabels,
  }
}
