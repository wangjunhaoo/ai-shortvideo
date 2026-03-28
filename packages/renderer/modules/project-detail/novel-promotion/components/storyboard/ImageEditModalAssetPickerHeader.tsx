'use client'

import { AppIcon } from '@/components/ui/icons'

interface ImageEditModalAssetPickerHeaderProps {
  title: string
  onClose: () => void
}

export default function ImageEditModalAssetPickerHeader({
  title,
  onClose,
}: ImageEditModalAssetPickerHeaderProps) {
  return (
    <div className="p-4 border-b flex items-center justify-between">
      <h4 className="font-bold text-[var(--glass-text-primary)]">
        {title}
      </h4>
      <button
        onClick={onClose}
        className="text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)]"
      >
        <AppIcon name="close" className="w-5 h-5" />
      </button>
    </div>
  )
}
