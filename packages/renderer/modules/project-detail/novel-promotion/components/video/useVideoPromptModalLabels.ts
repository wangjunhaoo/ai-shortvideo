'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

export function useVideoPromptModalLabels() {
  const t = useTranslations('video')

  return useMemo(() => ({
    title: (number: number) => t('promptModal.title', { number }),
    shotTypeLabel: t('promptModal.shotType'),
    durationSuffix: t('promptModal.duration'),
    locationLabel: t('promptModal.location'),
    locationUnknownLabel: t('promptModal.locationUnknown'),
    charactersLabel: t('promptModal.characters'),
    charactersNoneLabel: t('promptModal.charactersNone'),
    descriptionLabel: t('promptModal.description'),
    textLabel: t('promptModal.text'),
    promptLabel: t('promptModal.promptLabel'),
    promptPlaceholder: t('promptModal.placeholder'),
    tip: t('promptModal.tip'),
    cancelLabel: t('promptModal.cancel'),
    saveLabel: t('promptModal.save'),
  }), [t])
}
