'use client'

import PanelActionButtons from './PanelActionButtons'
import type { PanelActionLabels } from './PanelActionButtons.types'
import { usePanelCardSideActionsProps } from './hooks/usePanelCardSideActionsProps'

interface PanelCardSideActionsProps {
  labels: PanelActionLabels
  onInsertAfter?: () => void
  onVariant?: () => void
  disabled?: boolean
  hasImage: boolean
}

export default function PanelCardSideActions({
  labels,
  onInsertAfter,
  onVariant,
  disabled,
  hasImage,
}: PanelCardSideActionsProps) {
  const { shouldRender, actionButtonsProps } = usePanelCardSideActionsProps({
    labels,
    onInsertAfter,
    onVariant,
    disabled,
    hasImage,
  })

  if (!shouldRender) {
    return null
  }

  return (
    <div className="absolute -right-[22px] top-1/2 -translate-y-1/2 z-50">
      <PanelActionButtons {...actionButtonsProps} />
    </div>
  )
}
