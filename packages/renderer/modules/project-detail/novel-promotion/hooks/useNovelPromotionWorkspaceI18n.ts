'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

export function useNovelPromotionWorkspaceI18n() {
  const t = useTranslations('novelPromotion')
  const te = useTranslations('errors')
  const tc = useTranslations('common')
  const tProgress = useTranslations('progress')

  const workspaceLabels = useMemo(() => ({
    assetLibraryLabel: t('buttons.assetLibrary'),
    settingsLabel: t('buttons.settings'),
    refreshTitle: t('buttons.refreshData'),
    creatingMessage: t('storyInput.creating'),
    rebuildConfirmLabel: t('rebuildConfirm.confirm'),
    rebuildCancelLabel: t('rebuildConfirm.cancel'),
    loadingLabel: tc('loading'),
  }), [t, tc])

  const runConsoleLabels = useMemo(() => ({
    storyToScriptTitle: tProgress('runConsole.storyToScript'),
    storyToScriptSubtitle: tProgress('runConsole.storyToScriptSubtitle'),
    storyToScriptRunningLabel: tProgress('runConsole.storyToScriptRunning'),
    scriptToStoryboardTitle: tProgress('runConsole.scriptToStoryboard'),
    scriptToStoryboardSubtitle: tProgress('runConsole.scriptToStoryboardSubtitle'),
    scriptToStoryboardRunningLabel: tProgress('runConsole.scriptToStoryboardRunning'),
    stopLabel: tProgress('runConsole.stop'),
    minimizeLabel: tProgress('runConsole.minimize'),
  }), [tProgress])

  return {
    runConsoleLabels,
    t,
    tc,
    te,
    workspaceLabels,
  }
}
