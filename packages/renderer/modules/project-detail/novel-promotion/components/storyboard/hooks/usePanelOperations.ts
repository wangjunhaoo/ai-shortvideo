'use client'

import type { PanelEditData } from '../../PanelEditForm'
import { useRefreshProjectAssets } from '@renderer/hooks/useRendererProjectQueries'
import {
  usePanelCrudActions,
  type PanelCrudActionMessages,
} from './usePanelCrudActions'
import {
  usePanelInsertActions,
  type PanelInsertActionMessages,
} from './usePanelInsertActions'
import {
  useStoryboardGroupActions,
  type StoryboardGroupActionMessages,
} from './useStoryboardGroupActions'

interface UsePanelOperationsProps {
  projectId: string
  episodeId: string
  panelEditsRef: React.MutableRefObject<Record<string, PanelEditData>>
  messages: {
    group: StoryboardGroupActionMessages
    panelCrud: PanelCrudActionMessages
    panelInsert: PanelInsertActionMessages
  }
}

export function usePanelOperations({
  projectId,
  episodeId,
  panelEditsRef,
  messages,
}: UsePanelOperationsProps) {
  const onRefresh = useRefreshProjectAssets(projectId)

  const panelCrud = usePanelCrudActions({
    projectId,
    panelEditsRef,
    onRefresh,
    messages: messages.panelCrud,
  })

  const groupActions = useStoryboardGroupActions({
    projectId,
    episodeId,
    onRefresh,
    messages: messages.group,
  })

  const panelInsert = usePanelInsertActions({
    projectId,
    onRefresh,
    messages: messages.panelInsert,
  })

  return {
    savingPanels: panelCrud.savingPanels,
    deletingPanelIds: panelCrud.deletingPanelIds,
    saveStateByPanel: panelCrud.saveStateByPanel,
    hasUnsavedByPanel: panelCrud.hasUnsavedByPanel,
    submittingStoryboardTextIds: groupActions.submittingStoryboardTextIds,
    addingStoryboardGroup: groupActions.addingStoryboardGroup,
    movingClipId: groupActions.movingClipId,
    insertingAfterPanelId: panelInsert.insertingAfterPanelId,

    savePanel: panelCrud.savePanel,
    savePanelWithData: panelCrud.savePanelWithData,
    debouncedSave: panelCrud.debouncedSave,
    retrySave: panelCrud.retrySave,
    addPanel: panelCrud.addPanel,
    deletePanel: panelCrud.deletePanel,
    deleteStoryboard: groupActions.deleteStoryboard,
    regenerateStoryboardText: groupActions.regenerateStoryboardText,
    addStoryboardGroup: groupActions.addStoryboardGroup,
    moveStoryboardGroup: groupActions.moveStoryboardGroup,
    addCharacterToPanel: panelCrud.addCharacterToPanel,
    removeCharacterFromPanel: panelCrud.removeCharacterFromPanel,
    setPanelLocation: panelCrud.setPanelLocation,
    insertPanel: panelInsert.insertPanel,
  }
}
