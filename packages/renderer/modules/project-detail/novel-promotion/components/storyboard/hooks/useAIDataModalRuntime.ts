'use client'

import { useCallback, useMemo } from 'react'
import { buildAIDataPreviewJson } from '../buildAIDataPreviewJson'
import type {
  AIDataModalFormLabels,
  AIDataModalProps,
  AIDataModalViewLabels,
  AIDataSavePayload,
} from '../AIDataModal.types'
import { useAIDataModalState } from './useAIDataModalState'
import { useAIDataModalViewProps } from './useAIDataModalViewProps'

interface UseAIDataModalRuntimeParams {
  formPaneLabels: AIDataModalFormLabels
  viewLabels: AIDataModalViewLabels
  onClose: () => void
  onSave: (payload: AIDataSavePayload) => void
  stateParams: Pick<
    AIDataModalProps,
    | 'isOpen'
    | 'syncKey'
    | 'shotType'
    | 'cameraMove'
    | 'description'
    | 'videoPrompt'
    | 'photographyRules'
    | 'actingNotes'
  >
  viewParams: Pick<
    AIDataModalProps,
    'panelNumber' | 'videoRatio' | 'location' | 'characters'
  >
}

export function useAIDataModalRuntime({
  formPaneLabels,
  viewLabels,
  onClose,
  onSave,
  stateParams,
  viewParams,
}: UseAIDataModalRuntimeParams) {
  const {
    shotType,
    setShotType,
    cameraMove,
    setCameraMove,
    description,
    setDescription,
    videoPrompt,
    setVideoPrompt,
    photographyRules,
    actingNotes,
    updatePhotographyField,
    updatePhotographyCharacter,
    updateActingCharacter,
    savePayload,
  } = useAIDataModalState({
    isOpen: stateParams.isOpen,
    syncKey: stateParams.syncKey,
    initialShotType: stateParams.shotType,
    initialCameraMove: stateParams.cameraMove,
    initialDescription: stateParams.description,
    initialVideoPrompt: stateParams.videoPrompt,
    initialPhotographyRules: stateParams.photographyRules,
    initialActingNotes: stateParams.actingNotes,
  })

  const previewJson = useMemo(
    () =>
      buildAIDataPreviewJson({
        videoRatio: viewParams.videoRatio,
        shotType,
        cameraMove,
        description,
        location: viewParams.location,
        characters: viewParams.characters,
        videoPrompt,
        photographyRules,
        actingNotes,
      }),
    [
      actingNotes,
      cameraMove,
      description,
      photographyRules,
      shotType,
      videoPrompt,
      viewParams.characters,
      viewParams.location,
      viewParams.videoRatio,
    ],
  )

  const handleSave = useCallback(() => {
    onSave(savePayload)
    onClose()
  }, [onClose, onSave, savePayload])

  const { headerProps, formPaneProps, previewPaneProps, footerProps } =
    useAIDataModalViewProps({
      labels: viewLabels,
      panelNumber: viewParams.panelNumber,
      location: viewParams.location,
      characters: viewParams.characters,
      previewJson,
      shotType,
      cameraMove,
      description,
      videoPrompt,
      photographyRules,
      actingNotes,
      basicSectionLabels: formPaneLabels.basicSectionLabels,
      photographySectionLabels: formPaneLabels.photographySectionLabels,
      actingSectionLabels: formPaneLabels.actingSectionLabels,
      onClose,
      onSave: handleSave,
      onShotTypeChange: setShotType,
      onCameraMoveChange: setCameraMove,
      onDescriptionChange: setDescription,
      onVideoPromptChange: setVideoPrompt,
      onPhotographyFieldChange: updatePhotographyField,
      onPhotographyCharacterChange: updatePhotographyCharacter,
      onActingCharacterChange: updateActingCharacter,
    })

  return {
    headerProps,
    formPaneProps,
    previewPaneProps,
    footerProps,
  }
}
