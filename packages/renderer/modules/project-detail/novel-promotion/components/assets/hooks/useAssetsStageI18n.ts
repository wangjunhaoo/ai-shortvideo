'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

export function useAssetsStageI18n() {
  const t = useTranslations('assets')

  const batchGenerationMessages = useMemo(() => ({
    generateAllNoop: t('toolbar.generateAllNoop'),
    regenerateAllConfirm: t('toolbar.regenerateAllConfirm'),
    noAssetsToGenerate: t('toolbar.noAssetsToGenerate'),
  }), [t])

  const copyMessages = useMemo(() => ({
    copySuccessCharacter: t('assetLibrary.copySuccessCharacter'),
    copySuccessLocation: t('assetLibrary.copySuccessLocation'),
    copySuccessVoice: t('assetLibrary.copySuccessVoice'),
    copyFailed: (error: string) => t('assetLibrary.copyFailed', { error }),
  }), [t])

  const characterActionMessages = useMemo(() => ({
    unknownError: t('common.unknownError'),
    deleteConfirm: t('character.deleteConfirm'),
    deleteAppearanceConfirm: t('character.deleteAppearanceConfirm'),
    deleteFailed: (error: string) => t('character.deleteFailed', { error }),
    selectFailed: (error: string) => t('image.selectFailed', { error }),
    confirmSuccess: t('image.confirmSuccess'),
    confirmFailed: (error: string) => t('image.confirmFailed', { error }),
    regenerateFailed: (error: string) => t('image.regenerateFailed', { error }),
    updateDescriptionFailed: '更新描述失败:',
  }), [t])

  const locationActionMessages = useMemo(() => ({
    unknownError: t('common.unknownError'),
    deleteConfirm: t('location.deleteConfirm'),
    deleteFailed: (error: string) => t('location.deleteFailed', { error }),
    selectFailed: (error: string) => t('image.selectFailed', { error }),
    confirmSuccess: t('image.confirmSuccess'),
    confirmFailed: (error: string) => t('image.confirmFailed', { error }),
    regenerateFailed: (error: string) => t('image.regenerateFailed', { error }),
    updateDescriptionFailed: '更新描述失败:',
  }), [t])

  const ttsMessages = useMemo(() => ({
    unknownError: t('common.unknownError'),
    updateVoiceFailed: '更新音色失败:',
    voiceDesignSaved: (name: string) => t('tts.voiceDesignSaved', { name }),
    saveVoiceDesignFailed: (error: string) => t('tts.saveVoiceDesignFailed', { error }),
  }), [t])

  const profileMessages = useMemo(() => ({
    parseFailed: t('characterProfile.parseFailed'),
    confirmSuccessGenerating: t('characterProfile.confirmSuccessGenerating'),
    confirmFailed: (error: string) => t('characterProfile.confirmFailed', { error }),
    noPendingCharacters: t('characterProfile.noPendingCharacters'),
    batchConfirmPrompt: (count: number) => t('characterProfile.batchConfirmPrompt', { count }),
    batchConfirmSuccess: (count: number) => t('characterProfile.batchConfirmSuccess', { count }),
    batchConfirmFailed: (error: string) => t('characterProfile.batchConfirmFailed', { error }),
    deleteConfirm: t('characterProfile.deleteConfirm'),
    deleteSuccess: t('characterProfile.deleteSuccess'),
    deleteFailed: (error: string) => t('characterProfile.deleteFailed', { error }),
    unknownError: t('common.unknownError'),
  }), [t])

  return {
    t,
    batchGenerationMessages,
    copyMessages,
    characterActionMessages,
    locationActionMessages,
    ttsMessages,
    profileMessages,
  }
}
