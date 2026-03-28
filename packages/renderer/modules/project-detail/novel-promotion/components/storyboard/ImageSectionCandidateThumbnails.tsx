'use client'

import { MediaImageWithLoading } from '@/components/media/MediaImageWithLoading'
import { AppIcon } from '@/components/ui/icons'
import type { ImageSectionCandidateThumbnailsProps } from './ImageSectionCandidateMode.types'

export default function ImageSectionCandidateThumbnails({
  items,
}: ImageSectionCandidateThumbnailsProps) {
  return (
    <div className="flex gap-1">
      {items.map((item) => (
        <div key={item.key} className="relative group/thumb">
          <button
            onClick={item.onSelect}
            className={`w-8 h-8 rounded border-2 overflow-hidden ${
              item.isSelected
                ? 'border-[var(--glass-accent-from)]'
                : 'border-[var(--glass-stroke-base)] hover:border-[var(--glass-stroke-focus)]'
            }`}
          >
            <MediaImageWithLoading
              src={item.imageUrl}
              alt={item.altLabel}
              containerClassName="h-full w-full"
              className="w-full h-full object-cover"
            />
          </button>
          {item.onPreview && (
            <button
              onClick={(event) => {
                event.stopPropagation()
                item.onPreview?.()
              }}
              className="absolute -top-1 -right-1 w-4 h-4 glass-btn-base glass-btn-soft text-[var(--glass-text-primary)] rounded-full flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
              title={item.previewTitle}
            >
              <AppIcon name="searchPlus" className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
