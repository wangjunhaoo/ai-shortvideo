'use client'

import { useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'

interface CapabilityLabelField {
  field: string
  label: string
  labelKey?: string
  unitKey?: string
}

export function useVideoPanelRuntimeI18n() {
  const t = useTranslations('video')
  const tCommon = useTranslations('common')

  const translateCommon = useCallback((key: string) => tCommon(key as never), [tCommon])

  const safeTranslate = useCallback((key: string | undefined, fallback = ''): string => {
    if (!key) return fallback
    try {
      return t(key as never)
    } catch {
      return fallback
    }
  }, [t])

  const formatCapabilityLabel = useCallback((field: CapabilityLabelField): string => {
    const labelText = safeTranslate(field.labelKey, safeTranslate(`capability.${field.field}`, field.label))
    const unitText = safeTranslate(field.unitKey)
    return unitText ? `${labelText} (${unitText})` : labelText
  }, [safeTranslate])

  const labels = useMemo(() => ({
    shotAlt: (number: number) => t('panelCard.shot', { number }),
    linkToNextLabel: t('firstLastFrame.linkToNext'),
    unlinkActionLabel: t('firstLastFrame.unlinkAction'),
    originalLabel: t('panelCard.original'),
    syncedLabel: t('panelCard.synced'),
    unknownShotTypeLabel: t('panelCard.unknownShotType'),
    durationSuffix: t('promptModal.duration'),
    asLastFrameForLabel: (number: number) => t('firstLastFrame.asLastFrameFor', { number }),
    asFirstFrameForLabel: (number: number) => t('firstLastFrame.asFirstFrameFor', { number }),
    promptLabel: t('promptModal.promptLabel'),
    promptPlaceholder: t('promptModal.placeholder'),
    saveLabel: t('panelCard.save'),
    cancelLabel: t('panelCard.cancel'),
    clickToEditPromptLabel: t('panelCard.clickToEditPrompt'),
    firstLastFrameGeneratedLabel: t('firstLastFrame.generated'),
    firstLastFrameGenerateLabel: t('firstLastFrame.generate'),
    selectModelPlaceholder: t('panelCard.selectModel'),
    hasSyncedLabel: t('stage.hasSynced'),
    generateVideoLabel: t('panelCard.generateVideo'),
    lipSyncLabel: t('panelCard.lipSync'),
    redoLabel: t('panelCard.redo'),
    stopVoiceTitle: t('panelCard.stopVoice'),
    playTitle: t('panelCard.play'),
    generateAudioTitle: t('panelCard.generateAudio'),
    generateLabel: tCommon('generate'),
    lipSyncTitle: t('panelCard.lipSyncTitle'),
    lipSyncMayTakeMinutesLabel: t('panelCard.lipSyncMayTakeMinutes'),
    selectVoiceLabel: t('panelCard.selectVoice'),
    formatCapabilityLabel,
  }), [formatCapabilityLabel, t, tCommon])

  return {
    audioFailedMessage: t('panelCard.error.audioFailed'),
    labels,
    translateCommon,
  }
}
