'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PanelEditData } from '../../PanelEditForm'
import {
  PanelSaveCoordinator,
  type PanelSaveState,
} from './panel-save-coordinator'

interface UsePanelSaveLifecycleParams {
  panelEditsRef: React.MutableRefObject<Record<string, PanelEditData>>
  runSave: (payload: { storyboardId: string; snapshot: PanelEditData }) => Promise<void>
  resolveErrorMessage: (error: unknown) => string
}

function useSavingPanelsState() {
  const [savingPanels, setSavingPanels] = useState<Set<string>>(new Set())

  const applySavingChange = useCallback((panelId: string, isSaving: boolean) => {
    setSavingPanels((previous) => {
      const next = new Set(previous)
      if (isSaving) {
        next.add(panelId)
      } else {
        next.delete(panelId)
      }
      return next
    })
  }, [])

  const clearSavingPanel = useCallback((panelId: string) => {
    setSavingPanels((previous) => {
      const next = new Set(previous)
      next.delete(panelId)
      return next
    })
  }, [])

  return {
    savingPanels,
    applySavingChange,
    clearSavingPanel,
  }
}

export function usePanelSaveLifecycle({
  panelEditsRef,
  runSave,
  resolveErrorMessage,
}: UsePanelSaveLifecycleParams) {
  const {
    savingPanels,
    applySavingChange,
    clearSavingPanel,
  } = useSavingPanelsState()
  const [saveStateByPanel, setSaveStateByPanel] = useState<Record<string, PanelSaveState>>({})
  const saveTimeouts = useRef<Record<string, NodeJS.Timeout>>({})
  const panelSaveCoordinatorRef = useRef<PanelSaveCoordinator | null>(null)

  const setPanelSaveState = useCallback((panelId: string, nextState: PanelSaveState) => {
    setSaveStateByPanel((previous) => {
      const previousState = previous[panelId]
      if (
        previousState
        && previousState.status === nextState.status
        && previousState.errorMessage === nextState.errorMessage
      ) {
        return previous
      }
      return {
        ...previous,
        [panelId]: nextState,
      }
    })
  }, [])

  const coordinatorCallbacks = useMemo(() => ({
    onSavingChange: applySavingChange,
    onStateChange: setPanelSaveState,
    runSave: async ({ storyboardId, snapshot }: { storyboardId: string; snapshot: PanelEditData }) => {
      await runSave({ storyboardId, snapshot })
    },
    resolveErrorMessage,
  }), [applySavingChange, resolveErrorMessage, runSave, setPanelSaveState])

  if (!panelSaveCoordinatorRef.current) {
    panelSaveCoordinatorRef.current = new PanelSaveCoordinator(coordinatorCallbacks)
  }

  panelSaveCoordinatorRef.current.updateCallbacks(coordinatorCallbacks)

  const queuePanelSave = useCallback((
    panelId: string,
    storyboardId: string,
    snapshotOverride?: PanelEditData,
  ): Promise<void> | null => {
    const sourceSnapshot = snapshotOverride ?? panelEditsRef.current[panelId]
    return panelSaveCoordinatorRef.current?.queue(panelId, storyboardId, sourceSnapshot) ?? null
  }, [panelEditsRef])

  const savePanel = useCallback(async (storyboardId: string, panelIdOrData: string | PanelEditData) => {
    const panelId = typeof panelIdOrData === 'string' ? panelIdOrData : panelIdOrData.id
    if (!panelId) return
    const queued = queuePanelSave(
      panelId,
      storyboardId,
      typeof panelIdOrData === 'string' ? undefined : panelIdOrData,
    )
    if (queued) {
      await queued
    }
  }, [queuePanelSave])

  const debouncedSave = useCallback((panelId: string, storyboardId: string) => {
    if (saveTimeouts.current[panelId]) {
      clearTimeout(saveTimeouts.current[panelId])
    }
    saveTimeouts.current[panelId] = setTimeout(() => {
      void queuePanelSave(panelId, storyboardId)
    }, 500)
  }, [queuePanelSave])

  useEffect(() => () => {
    Object.values(saveTimeouts.current).forEach((timeoutId) => clearTimeout(timeoutId))
  }, [])

  const retrySave = useCallback((panelId: string) => {
    if (saveTimeouts.current[panelId]) {
      clearTimeout(saveTimeouts.current[panelId])
      delete saveTimeouts.current[panelId]
    }

    const latestSnapshot = panelEditsRef.current[panelId]
    const queued = panelSaveCoordinatorRef.current?.retry(panelId, latestSnapshot)
    if (queued) {
      void queued
    }
  }, [panelEditsRef])

  const hasUnsavedByPanel = useMemo(() => {
    const panelIds = Object.entries(saveStateByPanel)
      .filter(([, state]) => state.status === 'error')
      .map(([panelId]) => panelId)
    return new Set(panelIds)
  }, [saveStateByPanel])

  const clearPanelSaveLifecycle = useCallback((panelId: string) => {
    clearSavingPanel(panelId)
    setSaveStateByPanel((previous) => {
      if (!(panelId in previous)) return previous
      const rest = { ...previous }
      delete rest[panelId]
      return rest
    })
    panelSaveCoordinatorRef.current?.clear(panelId)
    if (saveTimeouts.current[panelId]) {
      clearTimeout(saveTimeouts.current[panelId])
      delete saveTimeouts.current[panelId]
    }
  }, [clearSavingPanel])

  return {
    savingPanels,
    saveStateByPanel,
    hasUnsavedByPanel,
    savePanel,
    debouncedSave,
    retrySave,
    clearPanelSaveLifecycle,
  }
}
