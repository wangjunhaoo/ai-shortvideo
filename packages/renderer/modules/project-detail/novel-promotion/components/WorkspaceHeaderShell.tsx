'use client'

import type { WorkspaceHeaderShellProps } from './workspace-header/types'
import { WorkspaceHeaderControls } from './workspace-header/WorkspaceHeaderControls'
import { WorkspaceEpisodeSelector } from './workspace-header/WorkspaceEpisodeSelector'
import { WorkspaceHeaderModals } from './workspace-header/WorkspaceHeaderModals'

export default function WorkspaceHeaderShell({
  isSettingsModalOpen,
  isWorldContextModalOpen,
  onCloseSettingsModal,
  onCloseWorldContextModal,
  availableModels,
  modelsLoaded,
  artStyle,
  analysisModel,
  characterModel,
  locationModel,
  storyboardModel,
  editModel,
  videoModel,
  audioModel,
  capabilityOverrides,
  videoRatio,
  ttsRate,
  onUpdateConfig,
  globalAssetText,
  projectName,
  episodes,
  currentEpisodeId,
  onEpisodeSelect,
  onEpisodeCreate,
  onEpisodeRename,
  onEpisodeDelete,
  capsuleNavItems,
  currentStage,
  onStageChange,
  projectId,
  episodeId,
  onOpenAssetLibrary,
  onOpenSettingsModal,
  onRefresh,
  assetLibraryLabel,
  settingsLabel,
  refreshTitle,
}: WorkspaceHeaderShellProps) {
  return (
    <>
      <WorkspaceHeaderModals
        isSettingsModalOpen={isSettingsModalOpen}
        isWorldContextModalOpen={isWorldContextModalOpen}
        onCloseSettingsModal={onCloseSettingsModal}
        onCloseWorldContextModal={onCloseWorldContextModal}
        availableModels={availableModels}
        modelsLoaded={modelsLoaded}
        artStyle={artStyle}
        analysisModel={analysisModel}
        characterModel={characterModel}
        locationModel={locationModel}
        storyboardModel={storyboardModel}
        editModel={editModel}
        videoModel={videoModel}
        audioModel={audioModel}
        capabilityOverrides={capabilityOverrides}
        videoRatio={videoRatio}
        ttsRate={ttsRate}
        onUpdateConfig={onUpdateConfig}
        globalAssetText={globalAssetText}
      />

      <WorkspaceEpisodeSelector
        projectName={projectName}
        episodes={episodes}
        currentEpisodeId={currentEpisodeId}
        onEpisodeSelect={onEpisodeSelect}
        onEpisodeCreate={onEpisodeCreate}
        onEpisodeRename={onEpisodeRename}
        onEpisodeDelete={onEpisodeDelete}
      />

      <WorkspaceHeaderControls
        capsuleNavItems={capsuleNavItems}
        currentStage={currentStage}
        onStageChange={onStageChange}
        projectId={projectId}
        episodeId={episodeId}
        onOpenAssetLibrary={onOpenAssetLibrary}
        onOpenSettingsModal={onOpenSettingsModal}
        onRefresh={onRefresh}
        assetLibraryLabel={assetLibraryLabel}
        settingsLabel={settingsLabel}
        refreshTitle={refreshTitle}
      />
    </>
  )
}

