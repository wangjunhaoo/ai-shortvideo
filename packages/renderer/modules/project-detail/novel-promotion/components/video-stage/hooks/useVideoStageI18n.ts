'use client'

import { useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { VideoToolbarLabels } from '@renderer/modules/project-detail/novel-promotion/components/video'
import type { VideoTimelinePanelLabels } from '@renderer/modules/project-detail/novel-promotion/components/video-stage/VideoTimelinePanel'

interface VideoCapabilityLabelField {
  field: string
  label: string
  labelKey?: string
  unitKey?: string
}

interface VideoBatchConfigLabels {
  title: string
  description: string
  modelPlaceholder: string
  cancelLabel: string
  confirmingLabel: string
  confirmGenerateAllLabel: string
}

function toFieldLabel(field: string): string {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())
}

export function useVideoStageI18n() {
  const t = useTranslations('video')

  const translate = useCallback((key: string) => t(key as never), [t])

  const safeTranslate = useCallback((key: string | undefined, fallback = ''): string => {
    if (!key) return fallback
    try {
      return t(key as never)
    } catch {
      return fallback
    }
  }, [t])

  const renderCapabilityLabel = useCallback((field: VideoCapabilityLabelField): string => {
    const labelText = safeTranslate(
      field.labelKey,
      safeTranslate(`capability.${field.field}`, field.label || toFieldLabel(field.field)),
    )
    const unitText = safeTranslate(field.unitKey)
    return unitText ? `${labelText} (${unitText})` : labelText
  }, [safeTranslate])

  const toolbarLabels = useMemo<VideoToolbarLabels>(() => ({
    title: t('toolbar.title'),
    totalShotsLabel: (count: number) => t('toolbar.totalShots', { count }),
    generatingShotsLabel: (count: number) => t('toolbar.generatingShots', { count }),
    completedShotsLabel: (count: number) => t('toolbar.completedShots', { count }),
    failedShotsLabel: (count: number) => t('toolbar.failedShots', { count }),
    generateAllLabel: t('toolbar.generateAll'),
    noVideosTitle: t('toolbar.noVideos'),
    downloadCountTitle: (count: number) => t('toolbar.downloadCount', { count }),
    downloadAllLabel: t('toolbar.downloadAll'),
    enterEditorTitle: t('toolbar.enterEditor'),
    needVideoTitle: t('panelCard.needVideo'),
    enterEditLabel: t('toolbar.enterEdit'),
    backLabel: t('toolbar.back'),
  }), [t])

  const timelineLabels = useMemo<VideoTimelinePanelLabels>(() => ({
    title: t('voice.title'),
    linesCountLabel: (count: number) => t('voice.linesCount', { count }),
    audioGeneratedCountLabel: (count: number) => t('voice.audioGeneratedCount', { count }),
  }), [t])

  const batchConfigLabels = useMemo<VideoBatchConfigLabels>(() => ({
    title: t('toolbar.batchConfigTitle'),
    description: t('toolbar.batchConfigDesc'),
    modelPlaceholder: t('panelCard.selectModel'),
    cancelLabel: t('panelCard.cancel'),
    confirmingLabel: t('toolbar.confirming'),
    confirmGenerateAllLabel: t('toolbar.confirmGenerateAll'),
  }), [t])

  return {
    batchConfigLabels,
    renderCapabilityLabel,
    timelineLabels,
    toolbarLabels,
    translate,
  }
}
