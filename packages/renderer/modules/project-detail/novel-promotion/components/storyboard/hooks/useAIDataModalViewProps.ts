'use client'

import { useMemo, type ComponentProps } from 'react'
import AIDataModalFooter from '../AIDataModalFooter'
import AIDataModalFormPane from '../AIDataModalFormPane'
import AIDataModalHeader from '../AIDataModalHeader'
import AIDataModalPreviewPane from '../AIDataModalPreviewPane'
import type {
  AIDataModalActingSectionLabels,
  AIDataModalBasicSectionLabels,
  AIDataModalPhotographySectionLabels,
} from '../AIDataModalFormPane.types'
import type {
  ActingCharacter,
  AIDataModalViewLabels,
  PhotographyCharacter,
  PhotographyRules,
} from '../AIDataModal.types'

interface UseAIDataModalViewPropsParams {
  labels: AIDataModalViewLabels
  panelNumber: number
  location: string | null
  characters: string[]
  previewJson: Record<string, unknown>
  shotType: string
  cameraMove: string
  description: string
  videoPrompt: string
  photographyRules: PhotographyRules | null
  actingNotes: ActingCharacter[]
  basicSectionLabels: AIDataModalBasicSectionLabels
  photographySectionLabels: AIDataModalPhotographySectionLabels
  actingSectionLabels: AIDataModalActingSectionLabels
  onClose: () => void
  onSave: () => void
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

export function useAIDataModalViewProps({
  labels,
  panelNumber,
  location,
  characters,
  previewJson,
  shotType,
  cameraMove,
  description,
  videoPrompt,
  photographyRules,
  actingNotes,
  basicSectionLabels,
  photographySectionLabels,
  actingSectionLabels,
  onClose,
  onSave,
  onShotTypeChange,
  onCameraMoveChange,
  onDescriptionChange,
  onVideoPromptChange,
  onPhotographyFieldChange,
  onPhotographyCharacterChange,
  onActingCharacterChange,
}: UseAIDataModalViewPropsParams) {
  const headerProps = useMemo(
    () =>
      ({
        title: labels.header.title,
        subtitle: labels.header.subtitle,
        onClose,
      }) satisfies ComponentProps<typeof AIDataModalHeader>,
    [labels.header.subtitle, labels.header.title, onClose, panelNumber],
  )

  const formPaneProps = useMemo(
    () =>
      ({
        basicSectionLabels,
        photographySectionLabels,
        actingSectionLabels,
        shotType,
        cameraMove,
        description,
        location,
        characters,
        videoPrompt,
        photographyRules,
        actingNotes,
        onShotTypeChange,
        onCameraMoveChange,
        onDescriptionChange,
        onVideoPromptChange,
        onPhotographyFieldChange,
        onPhotographyCharacterChange,
        onActingCharacterChange,
      }) satisfies ComponentProps<typeof AIDataModalFormPane>,
    [
      actingNotes,
      actingSectionLabels,
      basicSectionLabels,
      cameraMove,
      characters,
      description,
      location,
      onActingCharacterChange,
      onCameraMoveChange,
      onDescriptionChange,
      onPhotographyCharacterChange,
      onPhotographyFieldChange,
      onShotTypeChange,
      onVideoPromptChange,
      photographyRules,
      photographySectionLabels,
      shotType,
      videoPrompt,
    ],
  )

  const previewPaneProps = useMemo(
    () =>
      ({
        title: labels.preview.title,
        copyLabel: labels.preview.copyLabel,
        previewJson,
      }) satisfies ComponentProps<typeof AIDataModalPreviewPane>,
    [labels.preview.copyLabel, labels.preview.title, previewJson],
  )

  const footerProps = useMemo(
    () =>
      ({
        cancelLabel: labels.footer.cancelLabel,
        saveLabel: labels.footer.saveLabel,
        onClose,
        onSave,
      }) satisfies ComponentProps<typeof AIDataModalFooter>,
    [labels.footer.cancelLabel, labels.footer.saveLabel, onClose, onSave],
  )

  return {
    headerProps,
    formPaneProps,
    previewPaneProps,
    footerProps,
  }
}
