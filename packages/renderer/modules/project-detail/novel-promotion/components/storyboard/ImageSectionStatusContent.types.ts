'use client'

import type { ImageSectionStatusLabels } from './ImageSection.types'

export type ImageSectionStatusVariant = 'loading' | 'failed' | 'empty'

export interface ImageSectionStatusContentProps {
  variant: ImageSectionStatusVariant
  labels: ImageSectionStatusLabels
  panelId: string
  imageUrl: string | null
  failedError: string | null
  intent?: 'generate' | 'regenerate' | 'modify' | 'process'
  backdropImageUrl?: string | null
  onClearError: () => void
  onRegeneratePanelImage: (
    panelId: string,
    count?: number,
    force?: boolean,
  ) => void
  triggerPulse: () => void
}
