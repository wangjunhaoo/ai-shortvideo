'use client'

import { useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { VoiceControlPanelLabels } from '@renderer/modules/project-detail/novel-promotion/components/voice-stage/VoiceControlPanel'
import type { VoiceLineListLabels } from '@renderer/modules/project-detail/novel-promotion/components/voice-stage/VoiceLineList'
import type { SpeakerVoiceBindingDialogLabels } from '@renderer/modules/project-detail/novel-promotion/components/voice/SpeakerVoiceBindingDialog'

interface VoiceTaskFailureMessageParams {
  errorMessage: string | null
  lineIndex?: number | null
}

export function useVoiceStageI18n() {
  const t = useTranslations('voice')
  const tAssetHub = useTranslations('assetHub')
  const tVoiceDesign = useTranslations('voice.voiceDesign')

  const translate = useCallback((key: string) => t(key as never), [t])
  const translateWithValues = useCallback(
    (key: string, values?: Record<string, unknown>) => t(key as never, values as never),
    [t],
  )

  const buildVoiceTaskFailureMessage = useCallback((params: VoiceTaskFailureMessageParams) => {
    const lineLabel =
      typeof params.lineIndex === 'number'
        ? `#${params.lineIndex}`
        : translate('common.regenerate')
    const reason = params.errorMessage?.trim() || translate('errors.generateFailed')
    return `${translate('errors.generateFailed')} (${lineLabel}): ${reason}`
  }, [translate])

  const controlPanelLabels = useMemo<VoiceControlPanelLabels>(() => ({
    closeTitle: t('common.cancel'),
    toolbar: {
      backLabel: t('toolbar.back'),
      analyzingLabel: t('assets.stage.analyzing'),
      analyzeLinesLabel: t('toolbar.analyzeLines'),
      addLineLabel: t('toolbar.addLine'),
      uploadReferenceHint: t('toolbar.uploadReferenceHint'),
      generateAllLabel: t('toolbar.generateAll'),
      noDownloadTitle: t('toolbar.noDownload'),
      downloadCountTitle: (count: number) => t('toolbar.downloadCount', { count }),
      downloadAllLabel: t('toolbar.downloadAll'),
      statsLabel: ({ total, withVoice, withAudio }) => t('toolbar.stats', { total, withVoice, withAudio }),
    },
    embeddedToolbar: {
      linesStatsLabel: ({ total, audio }) => t('embedded.linesStats', { total, audio }),
      reanalyzeHint: t('embedded.reanalyzeHint'),
      analyzeHint: t('embedded.analyzeHint'),
      reanalyzeLabel: t('embedded.reanalyze'),
      analyzeLinesLabel: t('embedded.analyzeLines'),
      addLineLabel: t('embedded.addLine'),
      noDownloadTitle: t('toolbar.noDownload'),
      downloadCountTitle: (count: number) => t('toolbar.downloadCount', { count }),
      downloadVoiceLabel: t('embedded.downloadVoice'),
      generatingHint: t('embedded.generatingHint'),
      noVoiceHint: t('embedded.noVoiceHint'),
      noLinesHint: t('embedded.noLinesHint'),
      allDoneHint: t('embedded.allDoneHint'),
      generateHint: (count: number) => t('embedded.generateHint', { count }),
      generatingProgressLabel: ({ current, total }) => t('embedded.generatingProgress', { current, total }),
      generateAllVoiceLabel: t('embedded.generateAllVoice'),
      pendingCountLabel: (count: number) => t('embedded.pendingCount', { count }),
    },
    speakerStatus: {
      embeddedTitle: t('embedded.speakerVoiceStatus'),
      embeddedSpeakersCountLabel: (count: number) => t('embedded.speakersCount', { count }),
      linesCountLabel: (count: number) => t('speakerVoice.linesCount', { count }),
      configuredStatusLabel: t('speakerVoice.configuredStatus'),
      pendingStatusLabel: t('speakerVoice.pendingStatus'),
      inlineLabel: t('speakerVoice.inlineLabel'),
      voiceSettingsLabel: t('speakerVoice.voiceSettings'),
      title: t('speakerVoice.title'),
      hint: t('speakerVoice.hint'),
    },
    lineEditor: {
      editTitle: t('lineEditor.editTitle'),
      addTitle: t('lineEditor.addTitle'),
      contentLabel: t('lineEditor.contentLabel'),
      contentPlaceholder: t('lineEditor.contentPlaceholder'),
      speakerLabel: t('lineEditor.speakerLabel'),
      selectSpeaker: t('lineEditor.selectSpeaker'),
      noSpeakerOptions: t('lineEditor.noSpeakerOptions'),
      bindPanelLabel: t('lineEditor.bindPanelLabel'),
      unboundPanel: t('lineEditor.unboundPanel'),
      cancelLabel: t('common.cancel'),
      saveEditLabel: t('lineEditor.saveEdit'),
      saveAddLabel: t('lineEditor.saveAdd'),
    },
  }), [t])

  const voiceLineListLabels = useMemo<VoiceLineListLabels>(() => ({
    emptyState: {
      title: t('empty.title'),
      description: t('empty.description'),
      analyzeButtonLabel: t('empty.analyzeButton'),
      hint: t('empty.hint'),
    },
    lineCard: {
      locateVideoTitle: t('lineCard.locateVideo'),
      playTitle: t('lineCard.play'),
      pauseTitle: t('lineCard.pause'),
      regenerateTitle: t('common.regenerate'),
      downloadTitle: t('common.download'),
      generateLabel: t('common.generate'),
      deleteAudioTitle: t('lineCard.deleteAudio'),
      locateVideoLabel: t('lineCard.locateVideo'),
      editLineTitle: t('lineCard.editLine'),
      deleteLineTitle: t('lineCard.deleteLine'),
      emotionConfiguredLabel: t('lineCard.emotionConfigured'),
      emotionSettingsLabel: t('lineCard.emotionSettings'),
      voiceConfiguredLabel: t('lineCard.voiceConfigured'),
      needVoiceLabel: t('lineCard.needVoice'),
    },
    emotionSettings: {
      emotionPromptLabel: t('emotionPrompt'),
      emotionPromptTip: t('emotionPromptTip'),
      emotionPlaceholder: t('emotionPlaceholder'),
      emotionStrengthLabel: t('emotionStrength'),
      flatLabel: t('flat'),
      intenseLabel: t('intense'),
      generateVoiceLabel: t('generateVoice'),
    },
  }), [t])

  const speakerVoiceBindingLabels = useMemo<SpeakerVoiceBindingDialogLabels>(() => ({
    title: (speaker: string) => t('inlineBinding.title', { speaker }),
    description: t('inlineBinding.description'),
    selectFromLibraryLabel: t('inlineBinding.selectFromLibrary'),
    uploadAudioLabel: t('inlineBinding.uploadAudio'),
    aiDesignLabel: t('inlineBinding.aiDesign'),
    selectFromLibraryDesc: t('inlineBinding.selectFromLibraryDesc'),
    uploadAudioDesc: t('inlineBinding.uploadAudioDesc'),
    aiDesignDesc: t('inlineBinding.aiDesignDesc'),
    uploadQwenHint: t('inlineBinding.uploadQwenHint'),
    voicePicker: {
      title: tAssetHub('voicePickerTitle'),
      empty: tAssetHub('voicePickerEmpty'),
      cancel: tAssetHub('cancel'),
      confirm: tAssetHub('voicePickerConfirm'),
      preview: tVoiceDesign('preview'),
      playing: tVoiceDesign('playing'),
    },
  }), [t, tAssetHub, tVoiceDesign])

  return {
    buildVoiceTaskFailureMessage,
    controlPanelLabels,
    loadingLabel: t('common.loading'),
    speakerVoiceBindingLabels,
    translate,
    translateWithValues,
    voiceLineListLabels,
  }
}
