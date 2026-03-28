'use client'

import type { ComponentProps } from 'react'
import { AppIcon } from '@/components/ui/icons'

export interface PanelActionButtonsProps {
  labels: PanelActionLabels
  onInsertPanel: () => void
  onVariant: () => void
  disabled?: boolean
  hasImage: boolean
}

export interface PanelActionLabels {
  insertTitle: string
  insertTooltip: string
  variantTitle: string
  variantDisabledTitle: string
  variantTooltip: string
}

export interface PanelActionButtonItemProps {
  onClick: () => void
  disabled?: boolean
  title: string
  tooltip: string
  iconName: ComponentProps<typeof AppIcon>['name']
}
