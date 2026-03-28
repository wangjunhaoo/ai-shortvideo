'use client'

import { useMemo, type ComponentProps } from 'react'
import CandidateSelectorFooter from '../CandidateSelectorFooter'
import CandidateSelectorHeader from '../CandidateSelectorHeader'
import CandidateSelectorThumbnailStrip from '../CandidateSelectorThumbnailStrip'
import type {
  CandidateSelectorFooterProps,
  CandidateSelectorHeaderProps,
  CandidateSelectorThumbnailItem,
} from '../CandidateSelector.types'

interface UseCandidateSelectorSectionPropsParams {
  isConfirming: boolean
  onCancel: () => void
  thumbnailItems: CandidateSelectorThumbnailItem[]
  fallbackText: string
  footerProps: CandidateSelectorFooterProps
  title: string
  subtitle: string
}

export function useCandidateSelectorSectionProps({
  isConfirming,
  onCancel,
  thumbnailItems,
  fallbackText,
  footerProps,
  title,
  subtitle,
}: UseCandidateSelectorSectionPropsParams) {
  const containerClassName = useMemo(
    () => 'mb-4 p-4 glass-surface-soft border border-[var(--glass-stroke-focus)]',
    [],
  )

  const headerProps = useMemo(
    () =>
      ({
        title,
        subtitle,
        isConfirming,
        onCancel,
      } satisfies ComponentProps<typeof CandidateSelectorHeader>),
    [isConfirming, onCancel, subtitle, title],
  )

  const thumbnailStripProps = useMemo(
    () =>
      ({
        items: thumbnailItems,
        fallbackText,
      } satisfies ComponentProps<typeof CandidateSelectorThumbnailStrip>),
    [fallbackText, thumbnailItems],
  )

  const footerSectionProps = useMemo(
    () => footerProps satisfies ComponentProps<typeof CandidateSelectorFooter>,
    [footerProps],
  )

  return {
    containerClassName,
    headerProps: headerProps satisfies CandidateSelectorHeaderProps,
    thumbnailStripProps,
    footerProps: footerSectionProps,
  }
}
