'use client'

import type { ImageSectionContentLabels, ImageSectionProps } from './ImageSection.types'

export type ImageSectionContentProps = Pick<
  ImageSectionProps,
  | 'panelId'
  | 'imageUrl'
  | 'globalPanelNumber'
  | 'isDeleting'
  | 'isModifying'
  | 'isSubmittingPanelImageTask'
  | 'failedError'
  | 'candidateData'
  | 'onRegeneratePanelImage'
  | 'onSelectCandidateIndex'
  | 'onConfirmCandidate'
  | 'onCancelCandidate'
  | 'onClearError'
  | 'onPreviewImage'
> & {
  hasValidCandidates: boolean
  triggerPulse: () => void
  labels: ImageSectionContentLabels
}

export type ImageSectionContentMode =
  | 'deleting'
  | 'modifying'
  | 'submitting'
  | 'candidate'
  | 'candidate-loading'
  | 'failed'
  | 'image'
  | 'empty'
