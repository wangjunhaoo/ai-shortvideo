'use client'

import AIDataModal from './AIDataModal'
import ImageEditModal from './ImageEditModal'
import ImagePreviewModal from '@/components/ui/ImagePreviewModal'
import type {
  StoryboardModalRuntime,
  StoryboardStagePrimaryModalLabels,
} from './StoryboardStageModals.types'

interface StoryboardStagePrimaryModalsProps {
  modalRuntime: StoryboardModalRuntime
  labels: StoryboardStagePrimaryModalLabels
}

export default function StoryboardStagePrimaryModals({
  modalRuntime,
  labels,
}: StoryboardStagePrimaryModalsProps) {
  return (
    <>
      {modalRuntime.editingPanel ? (
        <ImageEditModal
          projectId={modalRuntime.projectId}
          labels={labels.imageEdit}
          defaultAssets={modalRuntime.imageEditDefaults}
          onSubmit={modalRuntime.handleEditSubmit}
          onClose={modalRuntime.closeImageEditModal}
        />
      ) : null}

      {modalRuntime.aiDataPanel && modalRuntime.aiDataRuntime ? (
        <AIDataModal
          isOpen={true}
          onClose={modalRuntime.closeAIDataModal}
          syncKey={modalRuntime.aiDataRuntime.panel.id}
          panelNumber={
            modalRuntime.aiDataRuntime.panelData.panelNumber ||
            modalRuntime.aiDataPanel.panelIndex + 1
          }
          shotType={modalRuntime.aiDataRuntime.panelData.shotType}
          cameraMove={modalRuntime.aiDataRuntime.panelData.cameraMove}
          description={modalRuntime.aiDataRuntime.panelData.description}
          location={modalRuntime.aiDataRuntime.panelData.location}
          characters={modalRuntime.aiDataRuntime.characterNames}
          videoPrompt={modalRuntime.aiDataRuntime.panelData.videoPrompt}
          photographyRules={modalRuntime.aiDataRuntime.photographyRules}
          actingNotes={modalRuntime.aiDataRuntime.actingNotes}
          videoRatio={modalRuntime.videoRatio}
          formPaneLabels={labels.aiData.formPaneLabels}
          viewLabels={{
            header: {
              title: labels.aiData.viewLabels.header.title,
              subtitle: labels.aiData.viewLabels.header.formatSubtitle(
                modalRuntime.aiDataRuntime.panelData.panelNumber ||
                  modalRuntime.aiDataPanel.panelIndex + 1,
              ),
            },
            preview: labels.aiData.viewLabels.preview,
            footer: labels.aiData.viewLabels.footer,
          }}
          onSave={modalRuntime.handleSaveAIData}
        />
      ) : null}

      {modalRuntime.previewImage ? (
        <ImagePreviewModal
          imageUrl={modalRuntime.previewImage}
          onClose={modalRuntime.closePreviewImage}
        />
      ) : null}
    </>
  )
}
