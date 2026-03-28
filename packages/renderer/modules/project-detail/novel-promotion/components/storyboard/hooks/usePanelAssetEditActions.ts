'use client'

import { useCallback } from 'react'
import type { PanelEditData } from '../../PanelEditForm'
import type { StoryboardPanel } from './useStoryboardState'
import { syncPanelCharacterDependentJson } from '@/lib/novel-promotion/panel-ai-data-sync'

interface UsePanelAssetEditActionsParams {
  debouncedSave: (panelId: string, storyboardId: string) => void
}

export function usePanelAssetEditActions({
  debouncedSave,
}: UsePanelAssetEditActionsParams) {
  const addCharacterToPanel = useCallback((
    panel: StoryboardPanel,
    characterName: string,
    appearance: string,
    storyboardId: string,
    getPanelEditData: (panel: StoryboardPanel) => PanelEditData,
    updatePanelEdit: (panelId: string, panel: StoryboardPanel, updates: Partial<PanelEditData>) => void,
  ) => {
    const currentData = getPanelEditData(panel)
    const exists = currentData.characters.some(
      (item) => item.name === characterName && item.appearance === appearance,
    )
    if (exists) return
    updatePanelEdit(panel.id, panel, {
      characters: [...currentData.characters, { name: characterName, appearance }],
    })
    debouncedSave(panel.id, storyboardId)
  }, [debouncedSave])

  const removeCharacterFromPanel = useCallback((
    panel: StoryboardPanel,
    index: number,
    storyboardId: string,
    getPanelEditData: (panel: StoryboardPanel) => PanelEditData,
    updatePanelEdit: (panelId: string, panel: StoryboardPanel, updates: Partial<PanelEditData>) => void,
  ) => {
    const currentData = getPanelEditData(panel)
    const synced = syncPanelCharacterDependentJson({
      characters: currentData.characters,
      removeIndex: index,
      actingNotesJson: currentData.actingNotes,
      photographyRulesJson: currentData.photographyRules,
    })
    const updates: Partial<PanelEditData> = {
      characters: synced.characters,
    }
    if (synced.actingNotesJson !== undefined) {
      updates.actingNotes = synced.actingNotesJson
    }
    if (synced.photographyRulesJson !== undefined) {
      updates.photographyRules = synced.photographyRulesJson
    }
    updatePanelEdit(panel.id, panel, updates)
    debouncedSave(panel.id, storyboardId)
  }, [debouncedSave])

  const setPanelLocation = useCallback((
    panel: StoryboardPanel,
    locationName: string | null,
    storyboardId: string,
    updatePanelEdit: (panelId: string, panel: StoryboardPanel, updates: Partial<PanelEditData>) => void,
  ) => {
    updatePanelEdit(panel.id, panel, { location: locationName })
    debouncedSave(panel.id, storyboardId)
  }, [debouncedSave])

  return {
    addCharacterToPanel,
    removeCharacterFromPanel,
    setPanelLocation,
  }
}
