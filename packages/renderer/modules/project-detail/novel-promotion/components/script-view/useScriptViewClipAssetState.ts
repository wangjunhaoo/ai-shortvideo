import { useCallback, useEffect, useRef, useState } from 'react'
import type { Character, Location } from '@/types/project'
import {
  fuzzyMatchLocation as fuzzyMatchLocationFromModule,
  getAllClipsAssets as getAllClipsAssetsFromModule,
  parseClipAssets as parseClipAssetsFromModule,
} from './clip-asset-utils'
import {
  getPrimaryAppearance,
  processCharacterInClip,
  processLocationInClip,
} from './asset-state-utils'
import { PRIMARY_APPEARANCE_INDEX } from '@/lib/constants'
import { logInfo as _ulogInfo } from '@/lib/logging/core'
import type { Clip } from './types'

interface UseScriptViewClipAssetStateInput {
  clips: Clip[]
  characters: Character[]
  locations: Location[]
  onClipUpdate?: (clipId: string, data: Partial<Clip>) => void | Promise<void>
  tAssets: (key: string, values?: Record<string, unknown>) => string
}

export function useScriptViewClipAssetState({
  clips,
  characters,
  locations,
  onClipUpdate,
  tAssets,
}: UseScriptViewClipAssetStateInput) {
  const [activeCharIds, setActiveCharIds] = useState<string[]>([])
  const [activeLocationIds, setActiveLocationIds] = useState<string[]>([])
  const [selectedAppearanceKeys, setSelectedAppearanceKeys] = useState<Set<string>>(new Set())
  const [assetViewMode, setAssetViewMode] = useState<'all' | string>('all')
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)

  const isManuallyEditingRef = useRef(false)
  const manualEditTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (clips.length > 0 && !selectedClipId) {
      setSelectedClipId(clips[0].id)
    }
  }, [clips, selectedClipId])

  const fuzzyMatchLocation = (clipLocName: string, libraryLocName: string): boolean =>
    fuzzyMatchLocationFromModule(clipLocName, libraryLocName)

  const parseClipAssets = (clip: Clip) => parseClipAssetsFromModule(clip)
  const getAllClipsAssets = useCallback(() => getAllClipsAssetsFromModule(clips), [clips])

  useEffect(() => {
    if (isManuallyEditingRef.current) {
      _ulogInfo('[ScriptView] skip sync while manual editing')
      return
    }

    let charNames = new Set<string>()
    let locNames = new Set<string>()
    let charAppearanceSet = new Set<string>()

    if (assetViewMode === 'all') {
      const all = getAllClipsAssets()
      charNames = all.allCharNames
      locNames = all.allLocNames
      charAppearanceSet = all.allCharAppearanceSet
    } else {
      const clip = clips.find((item) => item.id === assetViewMode)
      if (clip) {
        const parsed = parseClipAssets(clip)
        charNames = parsed.charNames
        locNames = parsed.locNames
        charAppearanceSet = parsed.charAppearanceSet
      }
    }

    const matchedCharIds: string[] = []
    const nextSelectedKeys = new Set<string>()

    characters.forEach((character) => {
      const aliases = character.name.split('/').map((alias) => alias.trim())
      const matched =
        aliases.some((alias) => charNames.has(alias)) || charNames.has(character.name)
      if (!matched) return

      matchedCharIds.push(character.id)
      const matchedAlias =
        aliases.find((alias) =>
          Array.from(charAppearanceSet).some((key) => key.startsWith(`${alias}::`)),
        ) ||
        (Array.from(charAppearanceSet).some((key) => key.startsWith(`${character.name}::`))
          ? character.name
          : null)

      if (!matchedAlias) return
      charAppearanceSet.forEach((key) => {
        if (!key.startsWith(`${matchedAlias}::`)) return
        const appearanceName = key.split('::')[1]
        nextSelectedKeys.add(`${character.id}::${appearanceName}`)
      })
    })

    const matchedLocIds = locations
      .filter((location) =>
        Array.from(locNames).some((clipLocName) =>
          fuzzyMatchLocation(clipLocName, location.name),
        ),
      )
      .map((location) => location.id)

    setActiveCharIds(matchedCharIds)
    setActiveLocationIds(matchedLocIds)
    setSelectedAppearanceKeys(nextSelectedKeys)
  }, [assetViewMode, characters, clips, getAllClipsAssets, locations])

  const handleUpdateClipAssets = async (
    type: 'character' | 'location',
    action: 'add' | 'remove',
    id: string,
    optionLabel?: string,
  ) => {
    if (!onClipUpdate) return

    const isAllMode = assetViewMode === 'all'
    const targetClipId = !isAllMode ? assetViewMode : selectedClipId
    if (!isAllMode && !targetClipId) return

    isManuallyEditingRef.current = true
    if (manualEditTimeoutRef.current) {
      clearTimeout(manualEditTimeoutRef.current)
    }
    manualEditTimeoutRef.current = setTimeout(() => {
      isManuallyEditingRef.current = false
      _ulogInfo('[ScriptView] manual editing lock released')
    }, 1500)

    if (type === 'character') {
      const targetChar = characters.find((character) => character.id === id)
      if (!targetChar) return

      const primaryLabel = tAssets('character.primary')
      const finalAppearanceName =
        optionLabel ||
        (targetChar.appearances?.find(
          (appearance) => appearance.appearanceIndex === PRIMARY_APPEARANCE_INDEX,
        )?.changeReason || primaryLabel)

      if (isAllMode && action === 'remove') {
        for (const clip of clips) {
          const newValue = processCharacterInClip({
            clip,
            action: 'remove',
            targetChar,
            appearanceName: optionLabel,
            characters,
            tAssets: (key) => tAssets(key),
          })
          if (newValue !== null) {
            await onClipUpdate(clip.id, { characters: newValue })
          }
        }

        const appearanceKey = `${id}::${finalAppearanceName}`
        const newKeys = new Set(selectedAppearanceKeys)
        newKeys.delete(appearanceKey)
        setSelectedAppearanceKeys(newKeys)

        const remainingAppearances = Array.from(newKeys).filter((key) =>
          key.startsWith(`${id}::`),
        )
        if (remainingAppearances.length === 0) {
          setActiveCharIds(activeCharIds.filter((activeId) => activeId !== id))
        }
        return
      }

      const clip = clips.find((item) => item.id === targetClipId)
      if (!clip) return

      const newValue = processCharacterInClip({
        clip,
        action,
        targetChar,
        appearanceName: optionLabel,
        characters,
        tAssets: (key) => tAssets(key),
      })

      const appearanceKey = `${id}::${finalAppearanceName}`
      const newKeys = new Set(selectedAppearanceKeys)
      if (action === 'add') {
        newKeys.add(appearanceKey)
        if (!activeCharIds.includes(id)) {
          setActiveCharIds([...activeCharIds, id])
        }
      } else {
        newKeys.delete(appearanceKey)
        const remainingAppearances = Array.from(newKeys).filter((key) =>
          key.startsWith(`${id}::`),
        )
        if (remainingAppearances.length === 0) {
          setActiveCharIds(activeCharIds.filter((activeId) => activeId !== id))
        }
      }
      setSelectedAppearanceKeys(newKeys)

      if (newValue !== null) {
        await onClipUpdate(targetClipId!, { characters: newValue })
      }
      return
    }

    const targetLoc = locations.find((location) => location.id === id)
    if (!targetLoc) return

    if (isAllMode && action === 'remove') {
      for (const clip of clips) {
        const newValue = processLocationInClip({
          clip,
          action: 'remove',
          targetLoc,
          fuzzyMatchLocation,
        })
        if (newValue !== null) {
          await onClipUpdate(clip.id, { location: newValue })
        }
      }
      setActiveLocationIds(activeLocationIds.filter((locationId) => locationId !== id))
      return
    }

    const clip = clips.find((item) => item.id === targetClipId)
    if (!clip) return

    const newValue = processLocationInClip({
      clip,
      action,
      targetLoc,
      locationName: optionLabel,
      fuzzyMatchLocation,
    })

    const nextActiveIds =
      action === 'add'
        ? [...activeLocationIds, id]
        : activeLocationIds.filter((locationId) => locationId !== id)
    setActiveLocationIds(nextActiveIds)

    if (newValue !== null) {
      await onClipUpdate(targetClipId!, { location: newValue })
    }
  }

  const { allCharNames: globalCharNames, allLocNames: globalLocNames } = getAllClipsAssets()

  const globalCharIds = characters
    .filter((character) => {
      const aliases = character.name.split('/').map((alias) => alias.trim())
      return (
        aliases.some((alias) => globalCharNames.has(alias)) ||
        globalCharNames.has(character.name)
      )
    })
    .map((character) => character.id)

  const globalLocationIds = locations
    .filter((location) =>
      Array.from(globalLocNames).some((clipLocName) =>
        fuzzyMatchLocation(clipLocName, location.name),
      ),
    )
    .map((location) => location.id)

  const globalActiveChars = characters.filter((character) =>
    globalCharIds.includes(character.id),
  )
  const globalActiveLocations = locations.filter((location) =>
    globalLocationIds.includes(location.id),
  )

  const charsWithoutImage = globalActiveChars.filter((character) => {
    const appearance = getPrimaryAppearance(character)
    const imageUrl = appearance?.imageUrl || appearance?.imageUrls?.[0]
    return !imageUrl
  })

  const locationsWithoutImage = globalActiveLocations.filter((location) => {
    const image =
      (location.selectedImageId
        ? location.images?.find((item) => item.id === location.selectedImageId)
        : undefined) ||
      location.images?.find((item) => item.isSelected) ||
      location.images?.find((item) => item.imageUrl)
    return !image?.imageUrl
  })

  return {
    activeCharIds,
    activeLocationIds,
    selectedAppearanceKeys,
    assetViewMode,
    setAssetViewMode,
    selectedClipId,
    setSelectedClipId,
    handleUpdateClipAssets,
    globalCharIds,
    globalLocationIds,
    allAssetsHaveImages:
      charsWithoutImage.length === 0 && locationsWithoutImage.length === 0,
    missingAssetsCount: charsWithoutImage.length + locationsWithoutImage.length,
  }
}
