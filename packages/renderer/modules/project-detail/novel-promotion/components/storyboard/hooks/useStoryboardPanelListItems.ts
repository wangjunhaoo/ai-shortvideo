'use client'

import { useMemo } from 'react'
import type { NovelPromotionPanel } from '@/types/project'
import type {
  StoryboardPanelListItemViewModel,
  StoryboardPanelListProps,
} from '../StoryboardPanelList.types'

type UseStoryboardPanelListItemsParams = Pick<
  StoryboardPanelListProps,
  | 'textPanels'
  | 'storyboardStartIndex'
  | 'savingPanels'
  | 'deletingPanelIds'
  | 'saveStateByPanel'
  | 'hasUnsavedByPanel'
  | 'modifyingPanels'
  | 'panelTaskErrorMap'
  | 'isPanelTaskRunning'
  | 'getPanelEditData'
  | 'getPanelCandidates'
>

export function useStoryboardPanelListItems({
  textPanels,
  storyboardStartIndex,
  savingPanels,
  deletingPanelIds,
  saveStateByPanel,
  hasUnsavedByPanel,
  modifyingPanels,
  panelTaskErrorMap,
  isPanelTaskRunning,
  getPanelEditData,
  getPanelCandidates,
}: UseStoryboardPanelListItemsParams) {
  return useMemo<StoryboardPanelListItemViewModel[]>(() => {
    return textPanels.map((panel, index) => {
      const imageUrl = panel.imageUrl || null
      const globalPanelNumber = storyboardStartIndex + index + 1
      const isPanelModifying =
        modifyingPanels.has(panel.id) ||
        Boolean(
          (
            panel as typeof panel & {
              imageTaskRunning?: boolean
              imageTaskIntent?: string
            }
          ).imageTaskRunning &&
            (
              panel as typeof panel & {
                imageTaskIntent?: string
              }
            ).imageTaskIntent === 'modify',
        )
      const isPanelDeleting = deletingPanelIds.has(panel.id)
      const panelSaveState = saveStateByPanel[panel.id]
      const isPanelSaving =
        savingPanels.has(panel.id) || panelSaveState?.status === 'saving'
      const hasUnsavedChanges =
        hasUnsavedByPanel.has(panel.id) || panelSaveState?.status === 'error'
      const panelSaveError = panelSaveState?.errorMessage || null
      const panelTaskRunning = isPanelTaskRunning(panel)
      const taskError = panelTaskErrorMap.get(panel.id)
      const panelFailedError = taskError?.message || null
      const panelData = getPanelEditData(panel)
      const panelCandidateData = getPanelCandidates(
        panel as unknown as NovelPromotionPanel,
      )

      return {
        panel,
        index,
        imageUrl,
        globalPanelNumber,
        isPanelModifying,
        isPanelDeleting,
        isPanelSaving,
        hasUnsavedChanges,
        panelSaveError,
        panelTaskRunning,
        panelFailedError,
        panelData,
        panelCandidateData,
      }
    })
  }, [
    deletingPanelIds,
    getPanelCandidates,
    getPanelEditData,
    hasUnsavedByPanel,
    isPanelTaskRunning,
    modifyingPanels,
    panelTaskErrorMap,
    saveStateByPanel,
    savingPanels,
    storyboardStartIndex,
    textPanels,
  ])
}
