'use client'

import AIDataModalPhotographyCharacters from './AIDataModalPhotographyCharacters'
import AIDataModalPhotographyFields from './AIDataModalPhotographyFields'
import type { AIDataModalPhotographySectionProps } from './AIDataModalFormPane.types'

export default function AIDataModalPhotographySection({
  labels,
  photographyRules,
  onPhotographyFieldChange,
  onPhotographyCharacterChange,
}: AIDataModalPhotographySectionProps) {
  if (!photographyRules) {
    return null
  }

  return (
    <>
      <div className="border-t border-[var(--glass-stroke-base)] pt-4 mt-4">
        <div className="text-sm font-medium text-[var(--glass-text-secondary)] mb-3">
          {labels.title}
        </div>
      </div>

      <AIDataModalPhotographyFields
        labels={labels}
        photographyRules={photographyRules}
        onPhotographyFieldChange={onPhotographyFieldChange}
      />

      <AIDataModalPhotographyCharacters
        labels={labels}
        photographyRules={photographyRules}
        onPhotographyCharacterChange={onPhotographyCharacterChange}
      />
    </>
  )
}
