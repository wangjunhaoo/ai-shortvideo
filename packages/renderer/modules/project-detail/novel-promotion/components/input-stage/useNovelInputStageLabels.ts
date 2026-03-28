'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

export function useNovelInputStageLabels() {
  const t = useTranslations('novelPromotion')

  const bannerLabels = useMemo(() => ({
    currentEditingLabel: (name: string) => t('storyInput.currentEditing', { name }),
    editingTip: t('storyInput.editingTip'),
  }), [t])

  const textInputLabels = useMemo(() => ({
    wordCountLabel: (count: number) => `${t('storyInput.wordCount')} ${count}`,
    assetLibraryTipTitle: t('storyInput.assetLibraryTip.title'),
    assetLibraryTipDescription: t('storyInput.assetLibraryTip.description'),
  }), [t])

  const configLabels = useMemo(() => ({
    videoRatioLabel: t('storyInput.videoRatio'),
    videoRatioHint: t('storyInput.videoRatioHint'),
    visualStyleLabel: t('storyInput.visualStyle'),
    visualStyleHint: t('storyInput.visualStyleHint'),
    currentConfigSummaryLabel: (ratio: string, style: string) =>
      t('storyInput.currentConfigSummary', { ratio, style }),
    assetLibraryRatioNote: t('storyInput.assetLibraryRatioNote'),
    moreConfig: t('storyInput.moreConfig'),
    recommendedLabel: t('smartImport.smartImport.recommended'),
    ratioUsageTextMap: {
      '1:1': t('storyInput.ratioUsage.1_1'),
      '9:16': t('storyInput.ratioUsage.9_16'),
      '16:9': t('storyInput.ratioUsage.16_9'),
      '4:3': t('storyInput.ratioUsage.4_3'),
      '3:4': t('storyInput.ratioUsage.3_4'),
      '2:3': t('storyInput.ratioUsage.2_3'),
      '3:2': t('storyInput.ratioUsage.3_2'),
      '4:5': t('storyInput.ratioUsage.4_5'),
      '5:4': t('storyInput.ratioUsage.5_4'),
      '21:9': t('storyInput.ratioUsage.21_9'),
    },
    ratioUsageTagMap: {
      '1:1': t('storyInput.ratioUsageTag.1_1'),
      '9:16': t('storyInput.ratioUsageTag.9_16'),
      '16:9': t('storyInput.ratioUsageTag.16_9'),
      '4:3': t('storyInput.ratioUsageTag.4_3'),
      '3:4': t('storyInput.ratioUsageTag.3_4'),
      '2:3': t('storyInput.ratioUsageTag.2_3'),
      '3:2': t('storyInput.ratioUsageTag.3_2'),
      '4:5': t('storyInput.ratioUsageTag.4_5'),
      '5:4': t('storyInput.ratioUsageTag.5_4'),
      '21:9': t('storyInput.ratioUsageTag.21_9'),
    },
  }), [t])

  const actionLabels = useMemo(() => ({
    narrationTitle: t('storyInput.narration.title'),
    narrationDescription: t('storyInput.narration.description'),
    nextLabel: t('smartImport.manualCreate.button'),
    readyLabel: t('storyInput.ready'),
    pleaseInputLabel: t('storyInput.pleaseInput'),
  }), [t])

  return {
    bannerLabels,
    textInputLabels,
    configLabels,
    actionLabels,
  }
}
