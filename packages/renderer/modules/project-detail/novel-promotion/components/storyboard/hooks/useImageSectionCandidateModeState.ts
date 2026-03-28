'use client'

import { useMemo, useState } from 'react'
import { logError as _ulogError, logInfo as _ulogInfo } from '@/lib/logging/core'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import type { TaskPresentationState } from '@/lib/task/presentation'
import type { ImageSectionCandidateModeProps } from '../ImageSectionCandidateMode.types'

export function useImageSectionCandidateModeState({
  panelId,
  imageUrl,
  candidateData,
  onConfirmCandidate,
}: Pick<
  ImageSectionCandidateModeProps,
  'panelId' | 'imageUrl' | 'candidateData' | 'onConfirmCandidate'
>) {
  const [isConfirming, setIsConfirming] = useState(false)

  const validCandidates = useMemo(
    () => candidateData.candidates.filter((url) => !url.startsWith('PENDING:')),
    [candidateData.candidates],
  )

  const safeSelectedIndex = useMemo(() => {
    if (validCandidates.length === 0) return 0
    return Math.min(candidateData.selectedIndex, validCandidates.length - 1)
  }, [candidateData.selectedIndex, validCandidates.length])

  const selectedCandidateUrl = validCandidates[safeSelectedIndex] ?? null

  const confirmingState: TaskPresentationState | null = isConfirming
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'process',
      resource: 'image',
      hasOutput: !!imageUrl,
    })
    : null

  const handleConfirm = async () => {
    if (!selectedCandidateUrl) return
    _ulogInfo('[ImageSection] 🎯 确认按钮被点击')
    _ulogInfo('[ImageSection] panelId:', panelId)
    _ulogInfo('[ImageSection] 选中的图片索引:', safeSelectedIndex)
    _ulogInfo('[ImageSection] 选中的图片 URL:', selectedCandidateUrl)
    setIsConfirming(true)
    try {
      await onConfirmCandidate(panelId, selectedCandidateUrl)
      _ulogInfo('[ImageSection] ✅ 确认操作完成')
    } catch (error) {
      _ulogError('[ImageSection] ❌ 确认操作失败:', error)
      setIsConfirming(false)
      _ulogInfo('[ImageSection] isConfirming 状态已重置为 false (失败重试)')
    }
  }

  return {
    isConfirming,
    validCandidates,
    safeSelectedIndex,
    confirmingState,
    handleConfirm,
  }
}
