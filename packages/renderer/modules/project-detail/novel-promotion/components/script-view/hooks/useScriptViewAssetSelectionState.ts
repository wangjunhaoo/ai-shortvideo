import { useCallback, useEffect, useRef, useState } from 'react'
import type { Character, CharacterAppearance, Location } from '@/types/project'

type Clip = {
  id: string
  location?: string | null
}

type TranslationFn = (key: string, values?: Record<string, unknown>) => string

type UseScriptViewAssetSelectionStateInput = {
  clips: Clip[]
  assetViewMode: 'all' | string
  characters: Character[]
  locations: Location[]
  activeCharIds: string[]
  activeLocationIds: string[]
  selectedAppearanceKeys: Set<string>
  onUpdateClipAssets: (
    type: 'character' | 'location',
    action: 'add' | 'remove',
    id: string,
    optionLabel?: string,
  ) => Promise<void>
  getSelectedAppearances: (char: Character) => CharacterAppearance[]
  tAssets: TranslationFn
}

function setsEqual<T>(left: Set<T>, right: Set<T>): boolean {
  if (left.size !== right.size) return false
  for (const item of left) {
    if (!right.has(item)) return false
  }
  return true
}

function parseAppearanceKey(key: string): { characterId: string; appearanceName: string } | null {
  const separatorIndex = key.indexOf('::')
  if (separatorIndex <= 0) return null
  const characterId = key.slice(0, separatorIndex)
  const appearanceName = key.slice(separatorIndex + 2)
  if (!characterId || !appearanceName) return null
  return { characterId, appearanceName }
}

function parseLocationNames(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => !!item)
    }
  } catch {
  }
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => !!item)
}

function fuzzyMatchLocationName(clipLocName: string, libraryLocName: string): boolean {
  const clipLower = clipLocName.toLowerCase().trim()
  const libraryLower = libraryLocName.toLowerCase().trim()
  if (!clipLower || !libraryLower) return false
  if (clipLower === libraryLower) return true
  if (clipLower.includes(libraryLower)) return true
  if (libraryLower.includes(clipLower)) return true
  return false
}

function readTrimmedLabel(value: string | undefined, fallback: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed || fallback
}

export function useScriptViewAssetSelectionState({
  clips,
  assetViewMode,
  characters,
  locations,
  activeCharIds,
  activeLocationIds,
  selectedAppearanceKeys,
  onUpdateClipAssets,
  getSelectedAppearances,
  tAssets,
}: UseScriptViewAssetSelectionStateInput) {
  const [showAddChar, setShowAddChar] = useState(false)
  const [showAddLoc, setShowAddLoc] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [initialAppearanceKeys, setInitialAppearanceKeys] = useState<Set<string>>(new Set())
  const [pendingAppearanceKeys, setPendingAppearanceKeys] = useState<Set<string>>(new Set())
  const [pendingAppearanceLabels, setPendingAppearanceLabels] = useState<Record<string, string>>({})
  const [pendingLocationIds, setPendingLocationIds] = useState<Set<string>>(new Set())
  const [pendingLocationLabels, setPendingLocationLabels] = useState<Record<string, string>>({})
  const [initialLocationLabels, setInitialLocationLabels] = useState<Record<string, string>>({})
  const [isSavingCharacterSelection, setIsSavingCharacterSelection] = useState(false)
  const [isSavingLocationSelection, setIsSavingLocationSelection] = useState(false)
  const hasInitializedCharDraftRef = useRef(false)
  const hasInitializedLocDraftRef = useRef(false)
  const charEditorTriggerRef = useRef<HTMLButtonElement | null>(null)
  const charEditorPopoverRef = useRef<HTMLDivElement | null>(null)
  const locEditorTriggerRef = useRef<HTMLButtonElement | null>(null)
  const locEditorPopoverRef = useRef<HTMLDivElement | null>(null)

  const isAllClipsMode = assetViewMode === 'all'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!showAddChar) {
      hasInitializedCharDraftRef.current = false
      return
    }
    if (hasInitializedCharDraftRef.current) return

    const nextKeys = new Set(selectedAppearanceKeys)
    const nextLabels: Record<string, string> = {}
    nextKeys.forEach((key) => {
      const parsed = parseAppearanceKey(key)
      if (parsed) {
        nextLabels[key] = parsed.appearanceName
      }
    })

    activeCharIds.forEach((characterId) => {
      const character = characters.find((item) => item.id === characterId)
      if (!character) return
      const appearances = getSelectedAppearances(character)
      appearances.forEach((appearance) => {
        const appearanceName = appearance.changeReason || tAssets('character.primary')
        const appearanceKey = `${character.id}::${appearanceName}`
        nextKeys.add(appearanceKey)
        if (!nextLabels[appearanceKey]) {
          nextLabels[appearanceKey] = appearanceName
        }
      })
    })

    const baselineKeys = new Set(nextKeys)
    setInitialAppearanceKeys(baselineKeys)
    setPendingAppearanceKeys(baselineKeys)
    setPendingAppearanceLabels(nextLabels)
    hasInitializedCharDraftRef.current = true
  }, [activeCharIds, characters, getSelectedAppearances, selectedAppearanceKeys, showAddChar, tAssets])

  useEffect(() => {
    if (!showAddLoc) {
      hasInitializedLocDraftRef.current = false
      return
    }
    if (hasInitializedLocDraftRef.current) return

    const nextIds = new Set(activeLocationIds)
    const nextLabels: Record<string, string> = {}

    activeLocationIds.forEach((locationId) => {
      const location = locations.find((item) => item.id === locationId)
      if (location) nextLabels[locationId] = location.name
    })

    if (assetViewMode !== 'all') {
      const currentClip = clips.find((clip) => clip.id === assetViewMode)
      const rawLocationNames = parseLocationNames(currentClip?.location)
      activeLocationIds.forEach((locationId) => {
        const location = locations.find((item) => item.id === locationId)
        if (!location) return
        const matchedRawName = rawLocationNames.find((name) => fuzzyMatchLocationName(name, location.name))
        if (matchedRawName) {
          nextLabels[locationId] = matchedRawName
        }
      })
    }

    setPendingLocationIds(nextIds)
    setPendingLocationLabels(nextLabels)
    setInitialLocationLabels(nextLabels)
    hasInitializedLocDraftRef.current = true
  }, [activeLocationIds, assetViewMode, clips, locations, showAddLoc])

  useEffect(() => {
    if (!showAddChar && !showAddLoc) return

    const handlePointerDownOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (showAddChar) {
        const isInCharPopover = charEditorPopoverRef.current?.contains(target)
        const isInCharTrigger = charEditorTriggerRef.current?.contains(target)
        if (!isInCharPopover && !isInCharTrigger) {
          setShowAddChar(false)
        }
      }

      if (showAddLoc) {
        const isInLocPopover = locEditorPopoverRef.current?.contains(target)
        const isInLocTrigger = locEditorTriggerRef.current?.contains(target)
        if (!isInLocPopover && !isInLocTrigger) {
          setShowAddLoc(false)
        }
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showAddChar) setShowAddChar(false)
        if (showAddLoc) setShowAddLoc(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDownOutside, true)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showAddChar, showAddLoc])

  const hasCharacterLabelChanges = !isAllClipsMode && Array.from(pendingAppearanceKeys).some((key) => {
    const parsed = parseAppearanceKey(key)
    if (!parsed) return false
    const nextLabel = readTrimmedLabel(pendingAppearanceLabels[key], parsed.appearanceName)
    return nextLabel !== parsed.appearanceName
  })

  const hasLocationLabelChanges = !isAllClipsMode && Array.from(pendingLocationIds).some((locationId) => {
    const location = locations.find((item) => item.id === locationId)
    if (!location) return false
    const baseLabel = initialLocationLabels[locationId] || location.name
    const nextLabel = readTrimmedLabel(pendingLocationLabels[locationId], location.name)
    return nextLabel !== baseLabel
  })

  const hasCharacterSelectionChanges = !setsEqual(initialAppearanceKeys, pendingAppearanceKeys) || hasCharacterLabelChanges
  const hasLocationSelectionChanges = !setsEqual(new Set(activeLocationIds), pendingLocationIds) || hasLocationLabelChanges

  const toggleCharacterEditor = useCallback(() => {
    setShowAddChar((prev) => !prev)
    setShowAddLoc(false)
  }, [])

  const toggleLocationEditor = useCallback(() => {
    setShowAddLoc((prev) => !prev)
    setShowAddChar(false)
  }, [])

  const toggleAppearanceSelection = useCallback((appearanceKey: string, currentAppearanceName: string) => {
    const isSelected = pendingAppearanceKeys.has(appearanceKey)
    setPendingAppearanceKeys((prev) => {
      const next = new Set(prev)
      if (isSelected) {
        next.delete(appearanceKey)
      } else {
        next.add(appearanceKey)
      }
      return next
    })
    setPendingAppearanceLabels((prev) => {
      const next = { ...prev }
      if (isSelected) {
        delete next[appearanceKey]
      } else if (!next[appearanceKey]) {
        next[appearanceKey] = currentAppearanceName
      }
      return next
    })
  }, [pendingAppearanceKeys])

  const toggleLocationSelection = useCallback((locationId: string, locationName: string) => {
    const isSelected = pendingLocationIds.has(locationId)
    setPendingLocationIds((prev) => {
      const next = new Set(prev)
      if (isSelected) {
        next.delete(locationId)
      } else {
        next.add(locationId)
      }
      return next
    })
    setPendingLocationLabels((prev) => {
      const next = { ...prev }
      if (isSelected) {
        delete next[locationId]
      } else if (!next[locationId]) {
        next[locationId] = locationName
      }
      return next
    })
  }, [pendingLocationIds])

  const handleConfirmCharacterSelection = useCallback(async () => {
    if (isSavingCharacterSelection) return
    setIsSavingCharacterSelection(true)
    try {
      const currentKeys = new Set(initialAppearanceKeys)
      const desiredKeys = new Set<string>()
      const desiredItems: Array<{ characterId: string; appearanceName: string; targetKey: string }> = []

      pendingAppearanceKeys.forEach((rawKey) => {
        const parsed = parseAppearanceKey(rawKey)
        if (!parsed) return
        const appearanceName = isAllClipsMode
          ? parsed.appearanceName
          : readTrimmedLabel(pendingAppearanceLabels[rawKey], parsed.appearanceName)
        const targetKey = `${parsed.characterId}::${appearanceName}`
        if (desiredKeys.has(targetKey)) return
        desiredKeys.add(targetKey)
        desiredItems.push({
          characterId: parsed.characterId,
          appearanceName,
          targetKey,
        })
      })

      for (const key of currentKeys) {
        if (desiredKeys.has(key)) continue
        const parsed = parseAppearanceKey(key)
        if (!parsed) continue
        await onUpdateClipAssets('character', 'remove', parsed.characterId, parsed.appearanceName)
      }

      for (const item of desiredItems) {
        if (currentKeys.has(item.targetKey)) continue
        await onUpdateClipAssets('character', 'add', item.characterId, item.appearanceName)
      }

      setShowAddChar(false)
    } finally {
      setIsSavingCharacterSelection(false)
    }
  }, [initialAppearanceKeys, isAllClipsMode, isSavingCharacterSelection, onUpdateClipAssets, pendingAppearanceKeys, pendingAppearanceLabels])

  const handleConfirmLocationSelection = useCallback(async () => {
    if (isSavingLocationSelection) return
    setIsSavingLocationSelection(true)
    try {
      const currentIds = new Set(activeLocationIds)

      for (const locationId of currentIds) {
        if (pendingLocationIds.has(locationId)) continue
        await onUpdateClipAssets('location', 'remove', locationId)
      }

      for (const locationId of pendingLocationIds) {
        const location = locations.find((item) => item.id === locationId)
        if (!location) continue

        const nextLabel = isAllClipsMode
          ? location.name
          : readTrimmedLabel(pendingLocationLabels[locationId], location.name)
        const baseLabel = initialLocationLabels[locationId] || location.name
        const changedLabel = currentIds.has(locationId) && nextLabel !== baseLabel

        if (changedLabel) {
          await onUpdateClipAssets('location', 'remove', locationId)
          await onUpdateClipAssets('location', 'add', locationId, nextLabel)
          continue
        }

        if (!currentIds.has(locationId)) {
          await onUpdateClipAssets('location', 'add', locationId, nextLabel)
        }
      }

      setShowAddLoc(false)
    } finally {
      setIsSavingLocationSelection(false)
    }
  }, [activeLocationIds, initialLocationLabels, isAllClipsMode, isSavingLocationSelection, locations, onUpdateClipAssets, pendingLocationIds, pendingLocationLabels])

  return {
    mounted,
    isAllClipsMode,
    showAddChar,
    showAddLoc,
    charEditorTriggerRef,
    charEditorPopoverRef,
    locEditorTriggerRef,
    locEditorPopoverRef,
    pendingAppearanceKeys,
    pendingAppearanceLabels,
    pendingLocationIds,
    pendingLocationLabels,
    isSavingCharacterSelection,
    isSavingLocationSelection,
    hasCharacterSelectionChanges,
    hasLocationSelectionChanges,
    setPendingAppearanceLabels,
    setPendingLocationLabels,
    setShowAddChar,
    setShowAddLoc,
    toggleCharacterEditor,
    toggleLocationEditor,
    toggleAppearanceSelection,
    toggleLocationSelection,
    handleConfirmCharacterSelection,
    handleConfirmLocationSelection,
  }
}
