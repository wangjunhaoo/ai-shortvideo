'use client'
import type { ImageSectionCandidateStatusBadgeProps } from './ImageSectionCandidateMode.types'

export default function ImageSectionCandidateStatusBadge({
  selectedCandidateLabel,
  visibleCandidateCount,
  pendingLabel,
}: ImageSectionCandidateStatusBadgeProps) {
  return (
    <div className="glass-chip glass-chip-success absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs">
      {selectedCandidateLabel}/{visibleCandidateCount}
      {pendingLabel ? ` (${pendingLabel})` : ''}
    </div>
  )
}
