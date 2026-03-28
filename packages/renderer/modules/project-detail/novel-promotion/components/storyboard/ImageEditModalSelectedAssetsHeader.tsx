'use client'

import { AppIcon } from '@/components/ui/icons'
import type { ImageEditModalSelectedAssetsLabels } from './ImageEditModal.types'

interface ImageEditModalSelectedAssetsHeaderProps {
  labels: ImageEditModalSelectedAssetsLabels
  selectedCount: number
  onOpenAssetPicker: () => void
}

export default function ImageEditModalSelectedAssetsHeader({
  labels,
  selectedCount,
  onOpenAssetPicker,
}: ImageEditModalSelectedAssetsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <label className="block text-sm font-medium text-[var(--glass-text-secondary)]">
        {labels.title}{' '}
        <span className="text-[var(--glass-text-tertiary)] font-normal">
          ({labels.countText.replace('{count}', String(selectedCount))})
        </span>
      </label>
      <button
        onClick={onOpenAssetPicker}
        className="text-sm text-[var(--glass-tone-info-fg)] hover:text-[var(--glass-tone-info-fg)] flex items-center gap-1"
      >
        <AppIcon name="plus" className="w-4 h-4" />
        {labels.addAssetLabel}
      </button>
    </div>
  )
}
