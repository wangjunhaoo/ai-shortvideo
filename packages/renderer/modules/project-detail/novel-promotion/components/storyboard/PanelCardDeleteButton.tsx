'use client'

import { AppIcon } from '@/components/ui/icons'

interface PanelCardDeleteButtonProps {
  title: string
  onDelete: () => void
}

export default function PanelCardDeleteButton({
  title,
  onDelete,
}: PanelCardDeleteButtonProps) {
  return (
    <button
      onClick={onDelete}
      className="absolute -top-2 -right-2 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity bg-[var(--glass-tone-danger-fg)] hover:bg-[var(--glass-tone-danger-fg)] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shadow-md"
      title={title}
    >
      <AppIcon name="closeMd" className="h-3 w-3" />
    </button>
  )
}
