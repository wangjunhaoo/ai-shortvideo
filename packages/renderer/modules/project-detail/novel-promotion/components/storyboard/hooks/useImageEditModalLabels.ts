'use client'

import { useMemo } from 'react'
import type { ImageEditModalLabels } from '../ImageEditModal.types'

interface UseImageEditModalLabelsParams {
  t: (key: string, values?: Record<string, unknown>) => string
}

export function useImageEditModalLabels({
  t,
}: UseImageEditModalLabelsParams) {
  return useMemo<ImageEditModalLabels>(
    () => ({
      emptyPromptMessage: t('prompts.enterInstruction'),
      title: t('imageEdit.title'),
      subtitle: t('imageEdit.subtitle'),
      promptLabel: t('prompts.aiInstruction'),
      promptPlaceholder: t('imageEdit.promptPlaceholder'),
      footerCancelLabel: t('candidate.cancel'),
      footerSubmitLabel: t('imageEdit.start'),
      selectedAssets: {
        title: t('imageEdit.selectedAssetsLabel'),
        countText: t('imageEdit.selectedAssetsCount'),
        addAssetLabel: t('imageEdit.addAsset'),
        emptyText: t('imageEdit.noAssets'),
      },
      referenceImages: {
        title: t('imageEdit.referenceImagesLabel'),
        hint: t('imageEdit.referenceImagesHint'),
      },
      assetPicker: {
        title: t('imageEdit.selectAsset'),
        confirmLabel: t('common.confirm'),
        characterLabel: t('prompts.character'),
        locationLabel: t('prompts.location'),
        defaultAppearanceLabel: t('panel.defaultAppearance'),
      },
    }),
    [t],
  )
}
