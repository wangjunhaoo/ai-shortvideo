'use client'

import type { AIDataModalActingSectionProps } from './AIDataModalFormPane.types'
import AIDataModalActingHeader from './AIDataModalActingHeader'
import AIDataModalActingCharacterCard from './AIDataModalActingCharacterCard'

export default function AIDataModalActingSection({
  labels,
  actingNotes,
  onActingCharacterChange,
}: AIDataModalActingSectionProps) {
  if (actingNotes.length === 0) {
    return null
  }

  return (
    <>
      <AIDataModalActingHeader title={labels.title} />

      <div className="space-y-3">
        {actingNotes.map((character, index) => (
          <AIDataModalActingCharacterCard
            key={index}
            actingDescriptionLabel={labels.actingDescription}
            character={character}
            index={index}
            onActingCharacterChange={onActingCharacterChange}
          />
        ))}
      </div>
    </>
  )
}
