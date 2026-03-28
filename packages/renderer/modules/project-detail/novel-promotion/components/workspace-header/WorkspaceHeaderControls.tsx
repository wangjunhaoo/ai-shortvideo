import { CapsuleNav } from '@/components/ui/CapsuleNav'
import WorkspaceTopActions from '../WorkspaceTopActions'
import type { WorkspaceHeaderNavItem } from './types'

interface WorkspaceHeaderControlsProps {
  capsuleNavItems: WorkspaceHeaderNavItem[]
  currentStage: string
  onStageChange: (stage: string) => void
  projectId: string
  episodeId?: string
  onOpenAssetLibrary: () => void
  onOpenSettingsModal: () => void
  onRefresh: () => void
  assetLibraryLabel: string
  settingsLabel: string
  refreshTitle: string
}

export function WorkspaceHeaderControls({
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
}: WorkspaceHeaderControlsProps) {
  return (
    <>
      <CapsuleNav
        items={capsuleNavItems}
        activeId={currentStage}
        onItemClick={onStageChange}
        projectId={projectId}
        episodeId={episodeId}
      />

      <WorkspaceTopActions
        onOpenAssetLibrary={onOpenAssetLibrary}
        onOpenSettings={onOpenSettingsModal}
        onRefresh={onRefresh}
        assetLibraryLabel={assetLibraryLabel}
        settingsLabel={settingsLabel}
        refreshTitle={refreshTitle}
      />
    </>
  )
}
