'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

export function useStageNavigationLabels() {
  const t = useTranslations('stages')

  return useMemo(() => ({
    configLabel: t('config'),
    assetsLabel: t('assets'),
    storyboardLabel: t('storyboard'),
    videosLabel: t('videos'),
    voiceLabel: t('voice'),
  }), [t])
}
