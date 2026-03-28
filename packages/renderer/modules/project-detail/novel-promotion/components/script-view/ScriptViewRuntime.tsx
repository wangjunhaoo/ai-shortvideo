'use client'
import { useMemo } from 'react'
import type { Character, Location } from '@/types/project'
import { useProjectAssets } from '@renderer/hooks/useRendererProjectQueries'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import ScriptViewScriptPanel from './ScriptViewScriptPanel'
import ScriptViewAssetsPanel from './ScriptViewAssetsPanel'
import { getSelectedAppearances } from './asset-state-utils'
import { useScriptViewTranslations } from './useScriptViewTranslations'
import { useScriptViewClipAssetState } from './useScriptViewClipAssetState'
import { useScriptViewClipSaving } from './useScriptViewClipSaving'
import type { ScriptViewProps } from './types'

export default function ScriptView({
  projectId,
  clips,
  onClipEdit,
  onClipUpdate,
  onClipDelete,
  onGenerateStoryboard,
  isSubmittingStoryboardBuild = false,
  assetsLoading = false,
  onOpenAssetLibrary,
}: ScriptViewProps) {
  const { t, tAssets, tNP, tScript, tCommon } = useScriptViewTranslations()

  const assetsLoadingState = assetsLoading
    ? resolveTaskPresentationState({
        phase: 'processing',
        intent: 'generate',
        resource: 'image',
        hasOutput: false,
      })
    : null

  const { data: assets } = useProjectAssets(projectId)
  const characters: Character[] = useMemo(() => assets?.characters ?? [], [assets?.characters])
  const locations: Location[] = useMemo(() => assets?.locations ?? [], [assets?.locations])
  const {
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
    allAssetsHaveImages,
    missingAssetsCount,
  } = useScriptViewClipAssetState({
    clips,
    characters,
    locations,
    onClipUpdate,
    tAssets,
  })
  const { savingClips, handleClipUpdateWithSaving } = useScriptViewClipSaving({
    onClipUpdate,
  })

  return (
    <div className="w-full grid grid-cols-12 gap-6 min-h-[400px] lg:h-[calc(100vh-180px)] animate-fadeIn">
      <ScriptViewScriptPanel
        clips={clips}
        selectedClipId={selectedClipId}
        onSelectClip={setSelectedClipId}
        savingClips={savingClips}
        onClipEdit={onClipEdit}
        onClipDelete={onClipDelete}
        onClipUpdate={handleClipUpdateWithSaving}
        t={t}
        tScript={tScript}
      />

      <ScriptViewAssetsPanel
        clips={clips}
        assetViewMode={assetViewMode}
        setAssetViewMode={setAssetViewMode}
        setSelectedClipId={setSelectedClipId}
        characters={characters}
        locations={locations}
        activeCharIds={activeCharIds}
        activeLocationIds={activeLocationIds}
        selectedAppearanceKeys={selectedAppearanceKeys}
        onUpdateClipAssets={handleUpdateClipAssets}
        onOpenAssetLibrary={onOpenAssetLibrary}
        assetsLoading={assetsLoading}
        assetsLoadingState={assetsLoadingState}
        allAssetsHaveImages={allAssetsHaveImages}
        globalCharIds={globalCharIds}
        globalLocationIds={globalLocationIds}
        missingAssetsCount={missingAssetsCount}
        onGenerateStoryboard={onGenerateStoryboard}
        isSubmittingStoryboardBuild={isSubmittingStoryboardBuild}
        getSelectedAppearances={(char) => getSelectedAppearances(char, selectedAppearanceKeys)}
        tScript={tScript}
        tAssets={tAssets}
        tNP={tNP}
        tCommon={tCommon}
      />
    </div>
  )
}
