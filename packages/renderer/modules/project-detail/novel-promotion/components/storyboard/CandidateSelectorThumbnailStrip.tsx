'use client'

import CandidateSelectorThumbnail from './CandidateSelectorThumbnail'
import type { CandidateSelectorThumbnailStripProps } from './CandidateSelector.types'

export default function CandidateSelectorThumbnailStrip({
  items,
  fallbackText,
}: CandidateSelectorThumbnailStripProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {items.map((item) => (
        <CandidateSelectorThumbnail
          key={item.key}
          label={item.label}
          alt={item.alt}
          imageUrl={item.imageUrl}
          fallbackText={fallbackText}
          isSelected={item.isSelected}
          width={item.width}
          height={item.height}
          onClick={item.onClick}
        />
      ))}
    </div>
  )
}
