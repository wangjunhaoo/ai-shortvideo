'use client'

import type {
  ImageSectionContentMode,
  ImageSectionContentProps,
} from '../ImageSectionContent.types'

export function useImageSectionContentMode({
  imageUrl,
  isDeleting,
  isModifying,
  isSubmittingPanelImageTask,
  failedError,
  candidateData,
  hasValidCandidates,
}: Pick<
  ImageSectionContentProps,
  | 'imageUrl'
  | 'isDeleting'
  | 'isModifying'
  | 'isSubmittingPanelImageTask'
  | 'failedError'
  | 'candidateData'
  | 'hasValidCandidates'
>): ImageSectionContentMode {
  if (isDeleting) return 'deleting'
  if (isModifying) return 'modifying'
  if (isSubmittingPanelImageTask) return 'submitting'
  if (candidateData) {
    return hasValidCandidates ? 'candidate' : 'candidate-loading'
  }
  if (failedError) return 'failed'
  if (imageUrl) return 'image'
  return 'empty'
}
