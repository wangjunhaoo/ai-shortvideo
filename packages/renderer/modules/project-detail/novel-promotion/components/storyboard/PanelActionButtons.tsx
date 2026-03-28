'use client'
import PanelActionButtonItem from './PanelActionButtonItem'
import type { PanelActionButtonsProps } from './PanelActionButtons.types'

export default function PanelActionButtons({
  labels,
  onInsertPanel,
  onVariant,
  disabled,
  hasImage,
}: PanelActionButtonsProps) {
  const actions = [
    {
      key: 'insert',
      onClick: onInsertPanel,
      disabled,
      title: labels.insertTitle,
      tooltip: labels.insertTooltip,
      iconName: 'plus' as const,
    },
    {
      key: 'variant',
      onClick: onVariant,
      disabled: disabled || !hasImage,
      title: hasImage ? labels.variantTitle : labels.variantDisabledTitle,
      tooltip: labels.variantTooltip,
      iconName: 'videoAlt' as const,
    },
  ]

  return (
    <div className="flex flex-col items-center gap-1">
      {actions.map((action) => (
        <PanelActionButtonItem
          key={action.key}
          onClick={action.onClick}
          disabled={action.disabled}
          title={action.title}
          tooltip={action.tooltip}
          iconName={action.iconName}
        />
      ))}
    </div>
  )
}
