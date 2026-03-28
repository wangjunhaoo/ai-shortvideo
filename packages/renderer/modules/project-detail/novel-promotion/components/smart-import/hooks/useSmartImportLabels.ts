'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

export function useSmartImportLabels() {
  const t = useTranslations('smartImport')

  const labels = useMemo(() => ({
    source: {
      markerDetectedTitle: t('markerDetected.title'),
      markerDetectedDescription: (count: number, type: string) => t('markerDetected.description', { count, type }),
      markerTypeLabel: (typeKey: string) => t(`markerDetected.markerTypes.${typeKey}` as 'numbered' | 'chapter' | 'custom'),
      markerPreviewLabel: t('markerDetected.preview'),
      episodeLabel: (num: number) => t('episode', { num }),
      wordsLabel: t('upload.words'),
      useMarkerLabel: t('markerDetected.useMarker'),
      useMarkerDescription: t('markerDetected.useMarkerDesc'),
      useAiLabel: t('markerDetected.useAI'),
      useAiDescription: t('markerDetected.useAIDesc'),
      cancelLabel: t('markerDetected.cancel'),
      title: t('title'),
      subtitle: t('subtitle'),
      manualCreateTitle: t('manualCreate.title'),
      manualCreateDescription: t('manualCreate.description'),
      manualCreateButtonLabel: t('manualCreate.button'),
      smartImportTitle: t('smartImport.title'),
      smartImportDescription: t('smartImport.description'),
      uploadPlaceholder: t('upload.placeholder'),
      startAnalysisLabel: t('upload.startAnalysis'),
    },
    mapping: {
      deleteConfirmTitle: t('preview.deleteConfirm.title'),
      deleteConfirmMessage: (title: string) => t('preview.deleteConfirm.message', { title }),
      deleteCancelLabel: t('preview.deleteConfirm.cancel'),
      deleteConfirmLabel: t('preview.deleteConfirm.confirm'),
      episodeListLabel: t('preview.episodeList'),
      episodeLabel: (num: number) => t('episode', { num }),
      wordsLabel: t('upload.words'),
      deleteEpisodeTitle: t('preview.deleteEpisode'),
      episodePlaceholder: t('preview.episodePlaceholder'),
      summaryPlaceholder: t('preview.summaryPlaceholder'),
      addEpisodeLabel: t('preview.addEpisode'),
      averageWordsLabel: t('preview.averageWords'),
      episodeContentLabel: t('preview.episodeContent'),
      plotSummaryLabel: t('plotSummary'),
    },
    confirm: {
      title: t('preview.title'),
      episodeCountLabel: (count: number) => t('preview.episodeCount', { count }),
      totalWordsLabel: (count: string) => t('preview.totalWords', { count }),
      autoSavedLabel: t('preview.autoSaved'),
      reanalyzeLabel: t('preview.reanalyze'),
      savingLabel: t('preview.saving'),
      confirmLabel: t('preview.confirm'),
      confirmAndAnalyzeLabel: t('globalAnalysis.confirmAndAnalyze'),
    },
    parse: {
      title: t('analyzing.title'),
      description: t('analyzing.description'),
      autoSaveLabel: t('analyzing.autoSave'),
    },
  }), [t])

  return {
    t,
    labels,
  }
}
