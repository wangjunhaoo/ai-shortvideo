'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useAIDataModalFormPaneLabels } from './useAIDataModalFormPaneLabels'
import { useImageEditModalLabels } from './useImageEditModalLabels'

export function useStoryboardStageLabels() {
  const t = useTranslations('storyboard')
  const translate = (key: string, values?: Record<string, unknown>) =>
    t(key as never, values as never)

  const controllerMessages = useMemo(() => ({
    panelOperations: {
      group: {
        unknownError: t('common.unknownError'),
        confirmDeleteGroup: (count: number) => t('confirm.deleteGroup', { count }),
        deleteGroupFailed: (error: string) => t('messages.deleteGroupFailed', { error }),
        regenerateGroupFailed: (error: string) => t('messages.regenerateGroupFailed', { error }),
        addGroupFailed: (error: string) => t('messages.addGroupFailed', { error }),
        moveGroupFailed: (error: string) => t('messages.moveGroupFailed', { error }),
      },
      panelCrud: {
        unknownError: t('common.unknownError'),
        defaultShotType: t('variant.defaultShotType'),
        defaultCameraMove: t('variant.defaultCameraMove'),
        newPanelDescription: t('panel.newPanelDescription'),
        confirmDeletePanel: t('confirm.deletePanel'),
        addPanelFailed: (error: string) => t('messages.addPanelFailed', { error }),
        deletePanelFailed: (error: string) => t('messages.deletePanelFailed', { error }),
      },
      panelInsert: {
        unknownError: t('common.unknownError'),
        insertPanelFailed: (error: string) => t('messages.insertPanelFailed', { error }),
      },
    },
    imageGeneration: {
      candidates: {
        unknownError: t('common.unknownError'),
        selectCandidateFailed: (error: string) => t('messages.selectCandidateFailed', { error }),
      },
      imageModification: {
        panelNotFound: t('messages.panelNotFound'),
        unknownError: t('common.unknownError'),
        modifyFailed: (error: string) => t('messages.modifyFailed', { error }),
      },
      imageDownload: {
        episodeNotFound: t('messages.episodeNotFound'),
        unknownError: t('common.unknownError'),
        downloadFailed: (error: string) => t('messages.downloadFailed', { error }),
      },
    },
    panelAssetActions: {
      unknownError: t('common.unknownError'),
      noneLabel: t('common.none'),
      batchGenerateCompleted: ({
        succeeded,
        failed,
        errors,
      }: {
        succeeded: number
        failed: number
        errors: string
      }) => t('messages.batchGenerateCompleted', { succeeded, failed, errors }),
      batchGenerateFailed: (error: string) => t('messages.batchGenerateFailed', { error }),
    },
    panelVariant: {
      generating: t('variant.generating'),
    },
  }), [t])

  const toolbarLabels = useMemo(() => ({
    addGroupAtStartLabel: t('group.addAtStart'),
    header: {
      title: t('header.storyboardPanel'),
      segmentsCountLabel: (count: number) => t('header.segmentsCount', { count }),
      panelsCountLabel: (count: number) => t('header.panelsCount', { count }),
      concurrencyLimitLabel: t('header.concurrencyLimit', { count: 10 }),
      generateAllPanelsLabel: t('header.generateAllPanels'),
      downloadingLabel: t('header.downloading'),
      downloadAllLabel: t('header.downloadAll'),
      backLabel: t('header.back'),
    },
  }), [t])

  const canvasLabels = useMemo(() => ({
    emptyTitle: t('canvas.emptyTitle'),
    emptyDescription: t('canvas.emptyDescription'),
    insertHereLabel: t('group.insertHere'),
  }), [t])

  const imageEditLabels = useImageEditModalLabels({ t: translate })
  const aiDataFormPaneLabels = useAIDataModalFormPaneLabels({ t: translate })

  const primaryModalLabels = useMemo(() => ({
    imageEdit: imageEditLabels,
    aiData: {
      formPaneLabels: aiDataFormPaneLabels,
      viewLabels: {
        header: {
          title: t('aiData.title'),
          formatSubtitle: (number: number) => t('aiData.subtitle', { number }),
        },
        preview: {
          title: t('aiData.jsonPreview'),
          copyLabel: t('common.copy'),
        },
        footer: {
          cancelLabel: t('candidate.cancel'),
          saveLabel: t('aiData.save'),
        },
      },
    },
  }), [aiDataFormPaneLabels, imageEditLabels, t])

  const assetPickerLabels = useMemo(() => ({
    character: {
      title: t('panel.selectCharacter'),
      noAssetsLabel: t('panel.noCharacterAssets'),
      defaultAppearanceLabel: t('panel.defaultAppearance'),
    },
    location: {
      title: t('panel.selectLocation'),
      noAssetsLabel: t('panel.noLocationAssets'),
      selectedLabel: t('panel.selected'),
    },
  }), [t])

  const stageShellLabels = useMemo(() => ({
    generateVideoLabel: t('header.generateVideo'),
  }), [t])

  return {
    controllerMessages,
    toolbarLabels,
    canvasLabels,
    primaryModalLabels,
    assetPickerLabels,
    stageShellLabels,
  }
}
