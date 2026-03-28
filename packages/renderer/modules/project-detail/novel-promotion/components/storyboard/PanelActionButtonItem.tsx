'use client'

import { AppIcon } from '@/components/ui/icons'
import type { PanelActionButtonItemProps } from './PanelActionButtons.types'

const BASE_BUTTON_CLASS = `
  group relative h-7 w-7 rounded-full
  glass-btn-base border border-[var(--glass-stroke-base)]
  bg-[var(--glass-bg-surface)] text-[var(--glass-text-secondary)]
  shadow-[var(--glass-shadow-sm)] transition-all duration-200 ease-out
  flex items-center justify-center
`

const ENABLED_BUTTON_CLASS = `
  hover:-translate-y-0.5 hover:shadow-[var(--glass-shadow-md)]
  hover:border-[var(--glass-stroke-focus)] hover:bg-[var(--glass-tone-info-bg)]
`

const DISABLED_BUTTON_CLASS = `
  bg-[var(--glass-bg-muted)] text-[var(--glass-text-tertiary)] cursor-not-allowed
`

export default function PanelActionButtonItem({
  onClick,
  disabled,
  title,
  tooltip,
  iconName,
}: PanelActionButtonItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${BASE_BUTTON_CLASS}
        ${disabled ? DISABLED_BUTTON_CLASS : ENABLED_BUTTON_CLASS}
      `}
      title={title}
    >
      <AppIcon name={iconName} className="w-4 h-4" />

      <span
        className={`
          absolute -top-8 left-1/2 -translate-x-1/2
          px-2 py-1 text-xs text-white bg-[var(--glass-overlay)] rounded
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          whitespace-nowrap pointer-events-none
          ${disabled ? 'hidden' : ''}
        `}
      >
        {tooltip}
      </span>
    </button>
  )
}
