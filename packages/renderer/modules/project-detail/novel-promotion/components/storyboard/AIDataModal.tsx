'use client'

import AIDataModalFooter from './AIDataModalFooter'
import AIDataModalFormPane from './AIDataModalFormPane'
import AIDataModalHeader from './AIDataModalHeader'
import AIDataModalPreviewPane from './AIDataModalPreviewPane'
import type { AIDataModalProps } from './AIDataModal.types'
import { useAIDataModalRuntime } from './hooks/useAIDataModalRuntime'

export type {
  AIDataModalProps,
  AIDataSavePayload,
  PhotographyRules,
  ActingCharacter,
  ActingNotes,
} from './AIDataModal.types'

export default function AIDataModal({
  isOpen,
  onClose,
  syncKey,
  panelNumber,
  shotType: initialShotType,
  cameraMove: initialCameraMove,
  description: initialDescription,
  location,
  characters,
  videoPrompt: initialVideoPrompt,
  photographyRules: initialPhotographyRules,
  actingNotes: initialActingNotes,
  videoRatio,
  formPaneLabels,
  viewLabels,
  onSave,
}: AIDataModalProps) {
  const { headerProps, formPaneProps, previewPaneProps, footerProps } =
    useAIDataModalRuntime({
      formPaneLabels,
      viewLabels,
      onClose,
      onSave,
      stateParams: {
        isOpen,
        syncKey,
        shotType: initialShotType,
        cameraMove: initialCameraMove,
        description: initialDescription,
        videoPrompt: initialVideoPrompt,
        photographyRules: initialPhotographyRules,
        actingNotes: initialActingNotes,
      },
      viewParams: {
        panelNumber,
        videoRatio,
        location,
        characters,
      },
    })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--glass-overlay)] backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[var(--glass-bg-surface)] rounded-2xl shadow-2xl w-[90vw] max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <AIDataModalHeader {...headerProps} />

        <div className="flex-1 overflow-hidden flex">
          <AIDataModalFormPane {...formPaneProps} />

          <AIDataModalPreviewPane {...previewPaneProps} />
        </div>

        <AIDataModalFooter {...footerProps} />
      </div>
    </div>
  )
}
