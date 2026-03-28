'use client'

import type { InsertPanelModalLabels } from './InsertPanelModal.types'
import type {
  PanelVariantModalProps,
  PanelVariantModalStateMessages,
} from './PanelVariantModal.types'
import type { VariantData, VariantOptions } from './hooks/usePanelVariant'

export interface PanelRuntimeSnapshot {
  id: string
  panelNumber: number | null
  description: string | null
  imageUrl: string | null
}

export interface VariantPanelRuntimeSnapshot extends PanelRuntimeSnapshot {
  storyboardId: string
}

export interface StoryboardGroupDialogsProps {
  insertAfterPanel: PanelRuntimeSnapshot | null
  nextPanelForInsert: PanelRuntimeSnapshot | null
  insertModalOpen: boolean
  insertDialogLabels: InsertPanelModalLabels
  insertingAfterPanelId: string | null
  onCloseInsertModal: () => void
  onInsert: (userInput: string) => Promise<void>
  variantModalPanel: VariantPanelRuntimeSnapshot | null
  projectId: string
  variantDialogLabels: PanelVariantModalProps['labels']
  variantDialogMessages: PanelVariantModalStateMessages
  submittingVariantPanelId: string | null
  onCloseVariantModal: () => void
  onVariant: (variant: VariantData, options: VariantOptions) => Promise<void>
}
