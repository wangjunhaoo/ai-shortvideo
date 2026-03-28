import { useCallback, useMemo, useState } from 'react'
import type { Character, CharacterAppearance, Location } from '@/types/project'

export interface AssetsStageToastState {
  message: string
  type: 'success' | 'warning' | 'error'
}

interface UseAssetsStageViewStateOptions {
  characters: Character[]
  locations: Location[]
  refreshAssets: () => void
}

export function useAssetsStageViewState({
  characters,
  locations,
  refreshAssets,
}: UseAssetsStageViewStateOptions) {
  const totalAppearances = useMemo(
    () => characters.reduce((sum, character) => sum + (character.appearances?.length || 0), 0),
    [characters],
  )
  const totalLocations = locations.length
  const totalAssets = totalAppearances + totalLocations

  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [toast, setToast] = useState<AssetsStageToastState | null>(null)

  const onRefresh = useCallback(() => {
    refreshAssets()
  }, [refreshAssets])

  const getAppearances = useCallback((character: Character): CharacterAppearance[] => {
    return character.appearances || []
  }, [])

  const showToast = useCallback(
    (message: string, type: AssetsStageToastState['type'] = 'success', duration = 3000) => {
      setToast({ message, type })
      setTimeout(() => setToast(null), duration)
    },
    [],
  )

  const closeToast = useCallback(() => {
    setToast(null)
  }, [])

  const closePreviewImage = useCallback(() => {
    setPreviewImage(null)
  }, [])

  return {
    totalAppearances,
    totalLocations,
    totalAssets,
    previewImage,
    setPreviewImage,
    closePreviewImage,
    toast,
    showToast,
    closeToast,
    getAppearances,
    onRefresh,
  }
}
