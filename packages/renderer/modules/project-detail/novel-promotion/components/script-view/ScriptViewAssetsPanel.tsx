'use client'

import { createPortal } from 'react-dom'
import type { Character, Location, CharacterAppearance } from '@/types/project'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { MediaImageWithLoading } from '@/components/media/MediaImageWithLoading'
import {
  SpotlightCharCard,
  SpotlightLocationCard,
  getSelectedLocationImage,
  type SpotlightCharCardLabels,
  type SpotlightLocationCardLabels,
} from './SpotlightCards'
import type { TaskPresentationState } from '@/lib/task/presentation'
import { AppIcon } from '@/components/ui/icons'
import { useScriptViewAssetSelectionState } from './hooks/useScriptViewAssetSelectionState'

interface Clip {
  id: string
  location?: string | null
}

interface ScriptViewAssetsPanelProps {
  clips: Clip[]
  assetViewMode: 'all' | string
  setAssetViewMode: (mode: 'all' | string) => void
  setSelectedClipId: (clipId: string) => void
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
  onOpenAssetLibrary?: () => void
  assetsLoading: boolean
  assetsLoadingState: TaskPresentationState | null
  allAssetsHaveImages: boolean
  globalCharIds: string[]
  globalLocationIds: string[]
  missingAssetsCount: number
  onGenerateStoryboard?: () => void
  isSubmittingStoryboardBuild: boolean
  getSelectedAppearances: (char: Character) => CharacterAppearance[]
  tScript: (key: string, values?: Record<string, unknown>) => string
  tAssets: (key: string, values?: Record<string, unknown>) => string
  tNP: (key: string, values?: Record<string, unknown>) => string
  tCommon: (key: string, values?: Record<string, unknown>) => string
}

function getAppearancePreviewUrl(appearance: CharacterAppearance): string | null {
  if (appearance.imageUrl) return appearance.imageUrl

  const selectedIndex = appearance.selectedIndex
  if (
    typeof selectedIndex === 'number' &&
    selectedIndex >= 0 &&
    selectedIndex < appearance.imageUrls.length
  ) {
    const selectedUrl = appearance.imageUrls[selectedIndex]
    if (selectedUrl) return selectedUrl
  }

  const firstAvailable = appearance.imageUrls.find((url) => !!url)
  return firstAvailable || null
}

export default function ScriptViewAssetsPanel({
  clips,
  assetViewMode,
  setAssetViewMode,
  setSelectedClipId,
  characters,
  locations,
  activeCharIds,
  activeLocationIds,
  selectedAppearanceKeys,
  onUpdateClipAssets,
  onOpenAssetLibrary,
  assetsLoading,
  assetsLoadingState,
  allAssetsHaveImages,
  globalCharIds,
  globalLocationIds,
  missingAssetsCount,
  onGenerateStoryboard,
  isSubmittingStoryboardBuild,
  getSelectedAppearances,
  tScript,
  tAssets,
  tNP,
  tCommon,
}: ScriptViewAssetsPanelProps) {
  const selectionState = useScriptViewAssetSelectionState({
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
  })

  const charCardLabels: SpotlightCharCardLabels = {
    removeConfirm: tScript('confirm.removeCharacter'),
    removeTitle: tScript('asset.removeFromClip'),
    generateCharacterLabel: tScript('asset.generateCharacter'),
    noAudioLabel: tScript('asset.noAudio'),
    playingLabel: tScript('asset.playing'),
    listenLabel: tScript('asset.listen'),
  }

  const locationCardLabels: SpotlightLocationCardLabels = {
    removeConfirm: tScript('confirm.removeLocation'),
    removeTitle: tScript('asset.removeFromClip'),
    generateLocationLabel: tScript('asset.generateLocation'),
  }

  return (
    <div className="col-span-12 lg:col-span-4 flex flex-col min-h-[300px] lg:h-full gap-4">
      <div className="flex flex-col gap-2 px-2">
        <h2 className="text-xl font-bold text-[var(--glass-text-primary)] flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[var(--glass-accent-from)] rounded-full" /> {tScript('inSceneAssets')}
        </h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setAssetViewMode('all')}
            className={`glass-btn-base px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${assetViewMode === 'all'
              ? 'glass-btn-primary'
              : 'glass-btn-secondary text-[var(--glass-text-secondary)]'
              }`}
          >
            {tScript('assetView.allClips')}
          </button>
          {clips.map((clip, idx) => (
            <button
              key={clip.id}
              onClick={() => {
                setAssetViewMode(clip.id)
                setSelectedClipId(clip.id)
              }}
              className={`glass-btn-base px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${assetViewMode === clip.id
                ? 'glass-btn-primary'
                : 'glass-btn-secondary text-[var(--glass-text-secondary)]'
                }`}
            >
              {tScript('segment.title', { index: idx + 1 })}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 glass-surface-modal overflow-y-auto p-4 custom-scrollbar flex flex-col gap-6">
        {assetsLoading && characters.length === 0 && locations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--glass-text-tertiary)] animate-pulse">
            <TaskStatusInline state={assetsLoadingState} />
          </div>
        )}

        <div className="relative">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-[var(--glass-text-secondary)] flex items-center gap-2">
              {tScript('asset.activeCharacters')} ({characters.filter((c) => activeCharIds.includes(c.id)).reduce((sum, char) => sum + getSelectedAppearances(char).length, 0)})
            </h3>
            <button
              ref={selectionState.charEditorTriggerRef}
              onClick={selectionState.toggleCharacterEditor}
              className="inline-flex h-8 w-8 items-center justify-center text-[var(--glass-text-secondary)] hover:text-[var(--glass-tone-info-fg)] transition-colors"
            >
              <AppIcon name="edit" className="h-4 w-4" />
            </button>
          </div>

          {selectionState.showAddChar && selectionState.mounted && createPortal(
            <div ref={selectionState.charEditorPopoverRef} className="fixed right-4 bottom-4 z-[80] glass-surface-modal w-[min(24rem,calc(100vw-2rem))] h-[min(560px,calc(100vh-2rem))] p-3 animate-fadeIn flex flex-col shadow-2xl">
              <div className="shrink-0 text-xs text-[var(--glass-text-tertiary)]">{tCommon('edit')} · {tScript('asset.activeCharacters')}</div>
              <div className="mt-3 flex-1 min-h-0 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                {selectionState.isAllClipsMode && (
                  <div className="rounded-lg border border-[var(--glass-stroke-base)] bg-[var(--glass-bg-muted)]/40 p-2 text-[11px] text-[var(--glass-text-tertiary)]">
                    当前为“全部片段”视图，文案要求仅在单片段视图可编辑
                  </div>
                )}
                {characters.map((c) => {
                  const appearances = c.appearances || []
                  const sortedAppearances = [...appearances].sort((a, b) => a.appearanceIndex - b.appearanceIndex)
                  return (
                    <div key={c.id} className="space-y-2">
                      <div className="text-xs font-semibold text-[var(--glass-text-primary)]">{c.name}</div>
                      <div className="grid grid-cols-3 gap-2">
                        {sortedAppearances.map((appearance) => {
                          const currentAppearanceName = appearance.changeReason || tAssets('character.primary')
                          const appearanceKey = `${c.id}::${currentAppearanceName}`
                          const isThisAppearanceSelected = selectionState.pendingAppearanceKeys.has(appearanceKey)
                          const previewUrl = getAppearancePreviewUrl(appearance)
                          return (
                            <div key={`${c.id}-${appearance.appearanceIndex}`} className="space-y-1">
                              <button
                                onClick={() => selectionState.toggleAppearanceSelection(appearanceKey, currentAppearanceName)}
                                className={`relative w-full rounded-lg overflow-hidden border-2 ${isThisAppearanceSelected ? 'border-[var(--glass-stroke-success)]' : 'border-transparent hover:border-[var(--glass-stroke-focus)]'}`}
                              >
                                <div className="aspect-square bg-[var(--glass-bg-muted)]">
                                  {previewUrl ? (
                                    <MediaImageWithLoading
                                      src={previewUrl}
                                      alt={`${c.name}-${currentAppearanceName}`}
                                      containerClassName="h-full w-full"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : null}
                                </div>
                                {isThisAppearanceSelected && (
                                  <span className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--glass-tone-success-fg)] text-white shadow-md">
                                    <AppIcon name="checkMicro" className="h-3 w-3" />
                                  </span>
                                )}
                              </button>
                              {isThisAppearanceSelected && (
                                <input
                                  value={selectionState.pendingAppearanceLabels[appearanceKey] || currentAppearanceName}
                                  disabled={selectionState.isAllClipsMode}
                                  onChange={(event) => {
                                    const value = event.target.value
                                    selectionState.setPendingAppearanceLabels((prev) => ({ ...prev, [appearanceKey]: value }))
                                  }}
                                  className="w-full rounded border border-[var(--glass-stroke-base)] bg-[var(--glass-bg-surface)] px-2 py-1 text-xs text-[var(--glass-text-secondary)] outline-none focus:border-[var(--glass-stroke-focus)] disabled:cursor-not-allowed disabled:opacity-60"
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 flex shrink-0 items-center justify-end gap-2 border-t border-[var(--glass-stroke-base)] pt-3">
                <button
                  onClick={() => selectionState.setShowAddChar(false)}
                  disabled={selectionState.isSavingCharacterSelection}
                  className="glass-btn-base glass-btn-secondary rounded-lg px-3 py-1.5 text-xs text-[var(--glass-text-secondary)]"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  onClick={() => void selectionState.handleConfirmCharacterSelection()}
                  disabled={selectionState.isSavingCharacterSelection || !selectionState.hasCharacterSelectionChanges}
                  className="glass-btn-base glass-btn-primary rounded-lg px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {tCommon('confirm')}
                </button>
              </div>
            </div>,
            document.body,
          )}

          {activeCharIds.length === 0 ? (
            <div className="text-center text-[var(--glass-text-tertiary)] text-sm py-4">{tScript('screenplay.noCharacter')}</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {characters
                .filter((c) => activeCharIds.includes(c.id))
                .flatMap((char) => {
                  const selectedApps = getSelectedAppearances(char)
                  if (selectedApps.length === 0) {
                    return (
                      <SpotlightCharCard
                        key={`${char.id}-missing`}
                        char={char}
                        appearance={undefined}
                        isActive={true}
                        onClick={() => { }}
                        onOpenAssetLibrary={onOpenAssetLibrary}
                        onRemove={() => void onUpdateClipAssets('character', 'remove', char.id, tScript('asset.defaultAppearance'))}
                        labels={charCardLabels}
                      />
                    )
                  }
                  return selectedApps.map((appearance) => (
                    <SpotlightCharCard
                      key={`${char.id}-${appearance.id}`}
                      char={char}
                      appearance={appearance}
                      isActive={true}
                      onClick={() => { }}
                      onOpenAssetLibrary={onOpenAssetLibrary}
                      onRemove={() => void onUpdateClipAssets('character', 'remove', char.id, appearance.changeReason || tScript('asset.defaultAppearance'))}
                      labels={charCardLabels}
                    />
                  ))
                })}
            </div>
          )}
        </div>

        <div className="relative">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-[var(--glass-text-secondary)]">{tScript('asset.activeLocations')} ({activeLocationIds.length})</h3>
            <button
              ref={selectionState.locEditorTriggerRef}
              onClick={selectionState.toggleLocationEditor}
              className="inline-flex h-8 w-8 items-center justify-center text-[var(--glass-text-secondary)] hover:text-[var(--glass-tone-info-fg)] transition-colors"
            >
              <AppIcon name="edit" className="h-4 w-4" />
            </button>
          </div>

          {selectionState.showAddLoc && selectionState.mounted && createPortal(
            <div ref={selectionState.locEditorPopoverRef} className="fixed right-4 bottom-4 z-[80] glass-surface-modal w-[min(24rem,calc(100vw-2rem))] h-[min(560px,calc(100vh-2rem))] p-3 animate-fadeIn flex flex-col shadow-2xl">
              <div className="shrink-0 text-xs text-[var(--glass-text-tertiary)]">{tCommon('edit')} · {tScript('asset.activeLocations')}</div>
              <div className="mt-3 flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                {selectionState.isAllClipsMode && (
                  <div className="mb-3 rounded-lg border border-[var(--glass-stroke-base)] bg-[var(--glass-bg-muted)]/40 p-2 text-[11px] text-[var(--glass-text-tertiary)]">
                    当前为“全部片段”视图，场景文案要求仅在单片段视图可编辑
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {locations.map((location) => {
                    const isSelected = selectionState.pendingLocationIds.has(location.id)
                    const previewImage = getSelectedLocationImage(location)?.imageUrl || null
                    return (
                      <div key={location.id} className="space-y-1">
                        <button
                          onClick={() => selectionState.toggleLocationSelection(location.id, location.name)}
                          className={`relative w-full overflow-hidden rounded-lg border-2 text-left transition-colors ${isSelected ? 'border-[var(--glass-stroke-success)]' : 'border-transparent hover:border-[var(--glass-stroke-focus)]'}`}
                        >
                          <div className="aspect-video bg-[var(--glass-bg-muted)]">
                            {previewImage ? (
                              <MediaImageWithLoading
                                src={previewImage}
                                alt={location.name}
                                containerClassName="h-full w-full"
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="truncate px-2 py-1 text-xs font-medium text-[var(--glass-text-secondary)]">
                            {location.name}
                          </div>
                          {isSelected && (
                            <span className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--glass-tone-success-fg)] text-white shadow-md">
                              <AppIcon name="checkMicro" className="h-3 w-3" />
                            </span>
                          )}
                        </button>
                        {isSelected && (
                          <input
                            value={selectionState.pendingLocationLabels[location.id] || location.name}
                            disabled={selectionState.isAllClipsMode}
                            onChange={(event) => {
                              const value = event.target.value
                              selectionState.setPendingLocationLabels((prev) => ({ ...prev, [location.id]: value }))
                            }}
                            className="w-full rounded border border-[var(--glass-stroke-base)] bg-[var(--glass-bg-surface)] px-2 py-1 text-xs text-[var(--glass-text-secondary)] outline-none focus:border-[var(--glass-stroke-focus)] disabled:cursor-not-allowed disabled:opacity-60"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="mt-3 flex shrink-0 items-center justify-end gap-2 border-t border-[var(--glass-stroke-base)] pt-3">
                <button
                  onClick={() => selectionState.setShowAddLoc(false)}
                  disabled={selectionState.isSavingLocationSelection}
                  className="glass-btn-base glass-btn-secondary rounded-lg px-3 py-1.5 text-xs text-[var(--glass-text-secondary)]"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  onClick={() => void selectionState.handleConfirmLocationSelection()}
                  disabled={selectionState.isSavingLocationSelection || !selectionState.hasLocationSelectionChanges}
                  className="glass-btn-base glass-btn-primary rounded-lg px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {tCommon('confirm')}
                </button>
              </div>
            </div>,
            document.body,
          )}

          {activeLocationIds.length === 0 ? (
            <div className="text-center text-[var(--glass-text-tertiary)] text-sm py-4">{tScript('screenplay.noLocation')}</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {locations.filter((l) => activeLocationIds.includes(l.id)).map((loc) => (
                <SpotlightLocationCard
                  key={loc.id}
                  location={loc}
                  isActive={true}
                  onClick={() => { }}
                  onOpenAssetLibrary={onOpenAssetLibrary}
                  onRemove={() => void onUpdateClipAssets('location', 'remove', loc.id)}
                  labels={locationCardLabels}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 mb-4">
        {!allAssetsHaveImages && globalCharIds.length + globalLocationIds.length > 0 && (
          <div className="mb-3 p-4 bg-[var(--glass-bg-surface)] border border-[var(--glass-stroke-base)] rounded-2xl shadow-sm">
            <p className="text-sm font-medium text-[var(--glass-text-primary)]">{tScript('generate.missingAssets', { count: missingAssetsCount })}</p>
            <p className="text-xs text-[var(--glass-text-tertiary)] mt-0.5">
              {tScript('generate.missingAssetsTip')}
              <button onClick={onOpenAssetLibrary} className="text-[var(--glass-tone-info-fg)] hover:underline mx-1">
                {tNP('buttons.assetLibrary')}
              </button>
              {tScript('generate.missingAssetsTipLink')}
            </p>
          </div>
        )}
        <button
          onClick={onGenerateStoryboard}
          disabled={isSubmittingStoryboardBuild || clips.length === 0 || !allAssetsHaveImages}
          className="w-full py-4 text-lg font-bold bg-[var(--glass-accent-from)] text-white rounded-2xl"
        >
          {isSubmittingStoryboardBuild ? tScript('generate.generating') : tScript('generate.startGenerate')}
        </button>
      </div>
    </div>
  )
}
