'use client'

import type { StoryboardGroupProps } from '../StoryboardGroup.types'
import type { StoryboardGroupChromeLabels } from '../StoryboardGroupChrome.types'
import type { PanelCardLabels } from '../PanelCard.types'
import type { InsertPanelModalLabels } from '../InsertPanelModal.types'
import type {
  PanelVariantModalProps,
  PanelVariantModalStateMessages,
} from '../PanelVariantModal.types'
import { useStoryboardGroupTaskErrors } from './useStoryboardGroupTaskErrors'
import { useStoryboardGroupRenderShell } from './useStoryboardGroupRenderShell'
import { useStoryboardGroupSectionProps } from './useStoryboardGroupSectionProps'
import { useStoryboardGroupViewState } from './useStoryboardGroupViewState'
import { useStoryboardInsertVariantRuntime } from './useStoryboardInsertVariantRuntime'

interface StoryboardGroupRuntimeLabels {
  chrome: StoryboardGroupChromeLabels
  clipSection: {
    stylePromptLabel: string
    sourceTextLabel: string
    screenplay: {
      tabs: {
        formatted: string
        original: string
      }
      scene: {
        formatSceneLabel: (number: number) => string
        charactersLabel: string
        voiceoverLabel: string
      }
      parseFailedTitle: string
      parseFailedDescription: string
    }
  }
  dialogs: {
    insertDialogLabels: InsertPanelModalLabels
    variantDialogLabels: PanelVariantModalProps['labels']
    variantDialogMessages: PanelVariantModalStateMessages
  }
  panelCard: PanelCardLabels
}

export function useStoryboardGroupRuntime(
  props: StoryboardGroupProps,
  labels: StoryboardGroupRuntimeLabels,
) {
  const insertVariantRuntime = useStoryboardInsertVariantRuntime({
    storyboardId: props.storyboard.id,
    textPanels: props.textPanels,
    onInsertPanel: props.onInsertPanel,
    onPanelVariant: props.onPanelVariant,
  })

  const { panelTaskErrorMap, clearPanelTaskError } = useStoryboardGroupTaskErrors({
    projectId: props.projectId,
    episodeId: props.episodeId,
  })

  const viewState = useStoryboardGroupViewState({
    textPanels: props.textPanels,
    submittingPanelImageIds: props.submittingPanelImageIds,
    panelTaskErrorMap,
    isSubmittingStoryboardTask: props.isSubmittingStoryboardTask,
    isSelectingCandidate: props.isSelectingCandidate,
    hasAnyImage: props.hasAnyImage,
    onRegeneratePanelImage: props.onRegeneratePanelImage,
    clearPanelTaskError,
  })

  const sectionProps = useStoryboardGroupSectionProps({
    props,
    chromeLabels: labels.chrome,
    dialogLabels: labels.dialogs,
    panelCardLabels: labels.panelCard,
    insertVariantRuntime,
    viewState,
    panelTaskErrorMap,
    clearPanelTaskError,
  })

  const renderShell = useStoryboardGroupRenderShell({
    clip: props.clip,
    isExpanded: props.isExpanded,
    clipSectionLabels: labels.clipSection,
    onToggleExpand: props.onToggleExpand,
    failedError: props.failedError,
  })

  return {
    renderShell,
    sections: sectionProps,
  }
}
