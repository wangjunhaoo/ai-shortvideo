'use client'

import { useState } from 'react'
import { resolveTaskPresentationState } from '@/lib/task/presentation'

interface UseCandidateSelectorStateParams {
  videoRatio: string
  selectedIndex: number
  originalLabel: string
  getCandidateLabel: (count: number) => string
  onConfirm: () => void
}

export function useCandidateSelectorState({
  videoRatio,
  selectedIndex,
  originalLabel,
  getCandidateLabel,
  onConfirm,
}: UseCandidateSelectorStateParams) {
  const [isConfirming, setIsConfirming] = useState(false)

  const confirmingState = isConfirming
    ? resolveTaskPresentationState({
        phase: 'processing',
        intent: 'process',
        resource: 'image',
        hasOutput: true,
      })
    : null

  const [w, h] = videoRatio.split(':').map(Number)
  const thumbWidth = 120
  const thumbHeight = Math.round((thumbWidth * h) / w)

  const selectedLabel =
    selectedIndex === 0 ? originalLabel : getCandidateLabel(selectedIndex)

  const handleConfirm = () => {
    setIsConfirming(true)
    onConfirm()
  }

  return {
    isConfirming,
    confirmingState,
    thumbWidth,
    thumbHeight,
    selectedLabel,
    handleConfirm,
  }
}
