'use client'

import { useMemo, useState } from 'react'
import { logError as _ulogError } from '@/lib/logging/core'
import type {
  Screenplay,
  ScreenplayDisplayTab,
} from '../ScreenplayDisplay.types'

interface UseScreenplayDisplayStateParams {
  screenplay: string | null
}

export function useScreenplayDisplayState({
  screenplay,
}: UseScreenplayDisplayStateParams) {
  const [activeTab, setActiveTab] =
    useState<ScreenplayDisplayTab>('screenplay')

  const parsedScreenplay = useMemo<Screenplay | null>(() => {
    if (!screenplay) {
      return null
    }

    try {
      return JSON.parse(screenplay) as Screenplay
    } catch (error) {
      _ulogError('Failed to parse screenplay:', error)
      return null
    }
  }, [screenplay])

  return {
    activeTab,
    setActiveTab,
    parsedScreenplay,
  }
}
