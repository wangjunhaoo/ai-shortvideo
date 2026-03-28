'use client'

import type {
  AIDataModalFormLabels,
  AIDataModalViewLabels,
} from './AIDataModal.types'
import type { ImageEditModalLabels } from './ImageEditModal.types'
import type {
  CharacterPickerModalLabels,
  LocationPickerModalLabels,
} from '../PanelEditForm'
import type { useStoryboardModalRuntime } from './hooks/useStoryboardModalRuntime'
import type { useStoryboardStageController } from './hooks/useStoryboardStageController'

export type StoryboardModalRuntime = ReturnType<typeof useStoryboardModalRuntime>
export type StoryboardStageController = ReturnType<typeof useStoryboardStageController>

export interface StoryboardStagePrimaryModalLabels {
  imageEdit: ImageEditModalLabels
  aiData: {
    formPaneLabels: AIDataModalFormLabels
    viewLabels: Omit<AIDataModalViewLabels, 'header'> & {
      header: {
        title: string
        formatSubtitle: (number: number) => string
      }
    }
  }
}

export interface StoryboardStageAssetPickerLabels {
  character: CharacterPickerModalLabels
  location: LocationPickerModalLabels
}

export interface StoryboardStageModalsProps {
  projectId: string
  modalRuntime: StoryboardModalRuntime
  getPanelEditData: StoryboardStageController['getPanelEditData']
  primaryLabels: StoryboardStagePrimaryModalLabels
  assetPickerLabels: StoryboardStageAssetPickerLabels
}
