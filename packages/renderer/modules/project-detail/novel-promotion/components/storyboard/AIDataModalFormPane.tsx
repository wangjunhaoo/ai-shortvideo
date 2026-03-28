'use client'

import AIDataModalActingSection from './AIDataModalActingSection'
import AIDataModalBasicSection from './AIDataModalBasicSection'
import AIDataModalPhotographySection from './AIDataModalPhotographySection'
import type { AIDataModalFormPaneProps } from './AIDataModalFormPane.types'
import { useAIDataModalFormPaneSectionProps } from './hooks/useAIDataModalFormPaneSectionProps'

export default function AIDataModalFormPane(props: AIDataModalFormPaneProps) {
  const {
    basicSectionProps,
    photographySectionProps,
    actingSectionProps,
  } = useAIDataModalFormPaneSectionProps(props)

  return (
    <div className="w-1/2 border-r border-[var(--glass-stroke-base)] overflow-y-auto p-6 space-y-5">
      <AIDataModalBasicSection {...basicSectionProps} />
      <AIDataModalPhotographySection {...photographySectionProps} />
      <AIDataModalActingSection {...actingSectionProps} />
    </div>
  )
}
