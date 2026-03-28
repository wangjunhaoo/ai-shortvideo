'use client'
import CandidateSelectorFooter from './CandidateSelectorFooter'
import CandidateSelectorHeader from './CandidateSelectorHeader'
import CandidateSelectorThumbnailStrip from './CandidateSelectorThumbnailStrip'
import type { CandidateSelectorProps } from './CandidateSelector.types'
import { useCandidateSelectorRuntime } from './hooks/useCandidateSelectorRuntime'

export default function CandidateSelector(props: CandidateSelectorProps) {
  const { sections } = useCandidateSelectorRuntime(props)

  return (
    <div className={sections.containerClassName}>
      <CandidateSelectorHeader {...sections.headerProps} />
      <CandidateSelectorThumbnailStrip {...sections.thumbnailStripProps} />
      <CandidateSelectorFooter {...sections.footerProps} />
    </div>
  )
}

