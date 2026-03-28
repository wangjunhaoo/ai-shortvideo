'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { ART_STYLES } from '@/lib/constants'
import type {
  PromptAppendMessages,
  PromptEditorMessages,
  PromptStageLabels,
} from '../promptStageRuntime.types'

export function usePromptStageI18n(artStyle: string) {
  const t = useTranslations('storyboard')
  const tCommon = useTranslations('common')
  const tNovelPromotion = useTranslations('novelPromotion')

  const styleLabel = useMemo(
    () =>
      ART_STYLES.find((style) => style.value === artStyle)?.label ||
      t('prompts.customStyle'),
    [artStyle, t],
  )

  const labels = useMemo<PromptStageLabels>(
    () => ({
      toolbar: {
        backLabel: tCommon('back'),
        panelsLabel: t('header.panels'),
        generatingLabel: t('group.generating'),
        generateAllLabel: t('group.generateAll'),
        previewLabel: tCommon('preview'),
        statusLabel: t('common.status'),
      },
      cardView: {
        shotAlt: (shotId) => `${t('panel.shot')}${shotId}`,
        regenerateImageTitle: t('panel.regenerateImage'),
        imagePromptLabel: t('prompts.imagePrompt'),
        currentPromptLabel: t('prompts.currentPrompt'),
        aiInstructionLabel: t('prompts.aiInstruction'),
        supportReferenceLabel: t('prompts.supportReference'),
        instructionPlaceholder: t('prompts.instructionPlaceholder'),
        selectAssetLabel: t('prompts.selectAsset'),
        characterLabel: t('prompts.character'),
        locationLabel: t('prompts.location'),
        referencedAssetsLabel: t('prompts.referencedAssets'),
        removeAssetTitle: t('prompts.removeAsset'),
        aiModifyTip: t('prompts.aiModifyTip'),
        aiModifyLabel: t('prompts.aiModify'),
        saveLabel: t('prompts.save'),
        cancelLabel: tCommon('cancel'),
        shotTypeLabel: t('panel.shotType'),
        locationFieldLabel: t('panel.location'),
        modeLabel: t('panel.mode'),
        generateLabel: t('assets.location.generateImage'),
        hasSyncedLabel: t('group.hasSynced'),
      },
      tableView: {
        shotLabel: t('panel.shot'),
        previewLabel: t('common.preview'),
        actionsLabel: t('common.actions'),
        generateLabel: t('common.generate'),
        imagePromptTitle: t('prompts.imagePrompt'),
        shotAlt: (shotId) => `${t('panel.shot')}${shotId}`,
      },
      appendSection: {
        title: t('prompts.appendTitle'),
        description: t('prompts.appendDescription'),
        placeholder: t('panelActions.pasteSrtPlaceholder'),
        submitLabel: t('prompts.appendSubmit'),
      },
      nextButton: {
        enterVideoGenerationLabel: tNovelPromotion('buttons.enterVideoGeneration'),
      },
    }),
    [t, tCommon, tNovelPromotion],
  )

  const editorMessages = useMemo<PromptEditorMessages>(
    () => ({
      unknownError: t('common.unknownError'),
      updateFailed: (error: string) => t('prompts.updateFailed', { error }),
      enterInstruction: t('prompts.enterInstruction'),
      modifyFailed: (error: string) => t('prompts.modifyFailed', { error }),
    }),
    [t],
  )

  const appendMessages = useMemo<PromptAppendMessages>(
    () => ({
      unknownError: t('common.unknownError'),
      enterContinuation: t('prompts.enterContinuation'),
      appendSuccess: t('prompts.appendSuccess'),
      appendFailed: (error: string) => t('prompts.appendFailed', { error }),
    }),
    [t],
  )

  return {
    styleLabel,
    labels,
    editorMessages,
    appendMessages,
  }
}
