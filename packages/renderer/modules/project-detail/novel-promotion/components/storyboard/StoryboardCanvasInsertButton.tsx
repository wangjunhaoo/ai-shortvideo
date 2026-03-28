'use client'

import { AppIcon } from '@/components/ui/icons'
import { GlassButton } from '@/components/ui/primitives'

interface StoryboardCanvasInsertButtonProps {
  label: string
  disabled: boolean
  onInsert: () => void
}

export default function StoryboardCanvasInsertButton({
  label,
  disabled,
  onInsert,
}: StoryboardCanvasInsertButtonProps) {
  return (
    <div className="flex justify-center py-2">
      <GlassButton
        variant="ghost"
        size="sm"
        onClick={onInsert}
        disabled={disabled}
        className="opacity-60 hover:opacity-100"
      >
        <AppIcon name="plusAlt" className="h-3 w-3" />
        <span>{label}</span>
      </GlassButton>
    </div>
  )
}
