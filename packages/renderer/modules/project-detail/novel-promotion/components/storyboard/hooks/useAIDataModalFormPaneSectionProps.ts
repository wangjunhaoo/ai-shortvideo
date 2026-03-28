'use client'

import { useMemo, type ComponentProps } from 'react'
import AIDataModalActingSection from '../AIDataModalActingSection'
import AIDataModalBasicSection from '../AIDataModalBasicSection'
import AIDataModalPhotographySection from '../AIDataModalPhotographySection'
import type { AIDataModalFormPaneProps } from '../AIDataModalFormPane.types'

export function useAIDataModalFormPaneSectionProps(
  props: AIDataModalFormPaneProps,
) {
  const basicSectionProps = useMemo(
    () =>
      ({
        labels: props.basicSectionLabels,
        shotType: props.shotType,
        cameraMove: props.cameraMove,
        description: props.description,
        location: props.location,
        characters: props.characters,
        videoPrompt: props.videoPrompt,
        onShotTypeChange: props.onShotTypeChange,
        onCameraMoveChange: props.onCameraMoveChange,
        onDescriptionChange: props.onDescriptionChange,
        onVideoPromptChange: props.onVideoPromptChange,
      } satisfies ComponentProps<typeof AIDataModalBasicSection>),
    [
      props.cameraMove,
      props.characters,
      props.description,
      props.location,
      props.basicSectionLabels,
      props.onCameraMoveChange,
      props.onDescriptionChange,
      props.onShotTypeChange,
      props.onVideoPromptChange,
      props.shotType,
      props.videoPrompt,
    ],
  )

  const photographySectionProps = useMemo(
    () =>
      ({
        labels: props.photographySectionLabels,
        photographyRules: props.photographyRules,
        onPhotographyFieldChange: props.onPhotographyFieldChange,
        onPhotographyCharacterChange: props.onPhotographyCharacterChange,
      } satisfies ComponentProps<typeof AIDataModalPhotographySection>),
    [
      props.onPhotographyCharacterChange,
      props.onPhotographyFieldChange,
      props.photographySectionLabels,
      props.photographyRules,
    ],
  )

  const actingSectionProps = useMemo(
    () =>
      ({
        labels: props.actingSectionLabels,
        actingNotes: props.actingNotes,
        onActingCharacterChange: props.onActingCharacterChange,
      } satisfies ComponentProps<typeof AIDataModalActingSection>),
    [props.actingNotes, props.actingSectionLabels, props.onActingCharacterChange],
  )

  return {
    basicSectionProps,
    photographySectionProps,
    actingSectionProps,
  }
}
