'use client'

import { useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'

export function useFirstLastFramePanelLabels() {
  const t = useTranslations('video')

  const renderCapabilityLabel = useCallback((field: string, fallback: string): string => {
    try {
      return t(`capability.${field}` as never)
    } catch {
      return fallback
    }
  }, [t])

  return useMemo(() => ({
    title: t('firstLastFrame.title'),
    rangeLabel: (from: number, to: number) => t('firstLastFrame.range', { from, to }),
    unlinkActionLabel: t('firstLastFrame.unlinkAction'),
    firstFrameAlt: t('firstLastFrame.firstFrame'),
    lastFrameAlt: t('firstLastFrame.lastFrame'),
    firstFrameBadge: t('firstLastFrame.firstFrame'),
    lastFrameBadge: t('firstLastFrame.lastFrame'),
    customPromptLabel: t('firstLastFrame.customPrompt'),
    useDefaultLabel: t('firstLastFrame.useDefault'),
    promptPlaceholder: t('firstLastFrame.promptPlaceholder'),
    generatedLabel: t('firstLastFrame.generated'),
    generateLabel: t('firstLastFrame.generate'),
    selectModelPlaceholder: t('panelCard.selectModel'),
    renderCapabilityLabel,
  }), [renderCapabilityLabel, t])
}
