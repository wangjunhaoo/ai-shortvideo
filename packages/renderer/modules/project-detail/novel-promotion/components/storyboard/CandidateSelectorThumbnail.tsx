'use client'

import { MediaImageWithLoading } from '@/components/media/MediaImageWithLoading'
import { AppIcon } from '@/components/ui/icons'
import type { CandidateSelectorThumbnailProps } from './CandidateSelector.types'

export default function CandidateSelectorThumbnail({
  label,
  alt,
  imageUrl,
  fallbackText,
  isSelected,
  width,
  height,
  onClick,
}: CandidateSelectorThumbnailProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className={`relative rounded-lg overflow-hidden border-3 transition-all hover:scale-105 ${
          isSelected
            ? 'border-[var(--glass-stroke-focus)] ring-2 ring-[var(--glass-focus-ring)] shadow-lg'
            : 'border-[var(--glass-stroke-strong)] hover:border-[var(--glass-stroke-focus)]'
        }`}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {imageUrl ? (
          <MediaImageWithLoading
            src={imageUrl}
            alt={alt}
            containerClassName="w-full h-full"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[var(--glass-bg-muted)] flex items-center justify-center text-[var(--glass-text-tertiary)] text-xs">
            {fallbackText}
          </div>
        )}
        {isSelected && (
          <div className="absolute top-1 right-1 w-5 h-5 bg-[var(--glass-accent-from)] text-white rounded-full flex items-center justify-center shadow">
            <AppIcon name="checkSm" className="w-3 h-3" />
          </div>
        )}
        <div className="absolute bottom-1 right-1 w-5 h-5 bg-[var(--glass-overlay)] text-white rounded flex items-center justify-center">
          <AppIcon name="searchPlus" className="w-3 h-3" />
        </div>
      </button>
      <span className="text-xs text-[var(--glass-text-secondary)]">{label}</span>
    </div>
  )
}
