'use client'

import { useState } from 'react'
import type { PanelCandidateData } from '../ImageSection.types'

interface UseImageSectionStateParams {
  videoRatio: string
  candidateData: PanelCandidateData | null
}

export function useImageSectionState({
  videoRatio,
  candidateData,
}: UseImageSectionStateParams) {
  const [isTaskPulseAnimating, setIsTaskPulseAnimating] = useState(false)
  const cssAspectRatio = videoRatio.replace(':', '/')
  const hasValidCandidates = Boolean(
    candidateData &&
      candidateData.candidates.some((url) => !url.startsWith('PENDING:')),
  )

  const triggerPulse = () => {
    setIsTaskPulseAnimating(true)
    setTimeout(() => setIsTaskPulseAnimating(false), 600)
  }

  return {
    isTaskPulseAnimating,
    cssAspectRatio,
    hasValidCandidates,
    triggerPulse,
  }
}
