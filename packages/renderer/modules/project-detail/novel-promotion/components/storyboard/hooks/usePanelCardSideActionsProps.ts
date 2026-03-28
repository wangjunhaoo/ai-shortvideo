'use client'

import type { ComponentProps } from 'react'
import PanelActionButtons from '../PanelActionButtons'
import type { PanelActionLabels } from '../PanelActionButtons.types'

export function usePanelCardSideActionsProps({
  labels,
  onInsertAfter,
  onVariant,
  disabled,
  hasImage,
}: {
  labels: PanelActionLabels
  onInsertAfter?: () => void
  onVariant?: () => void
  disabled?: boolean
  hasImage: boolean
}) {
  const shouldRender = !!onInsertAfter || !!onVariant
  const actionButtonsProps: ComponentProps<typeof PanelActionButtons> = {
    labels,
    onInsertPanel: onInsertAfter || (() => {}),
    onVariant: onVariant || (() => {}),
    disabled,
    hasImage,
  }

  return {
    shouldRender,
    actionButtonsProps,
  }
}
