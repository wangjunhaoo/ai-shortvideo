'use client'

import type { AIDataModalBasicSectionProps } from './AIDataModalFormPane.types'
import AIDataModalBasicPrimaryFields from './AIDataModalBasicPrimaryFields'
import AIDataModalBasicSceneSummary from './AIDataModalBasicSceneSummary'
import AIDataModalBasicPrompts from './AIDataModalBasicPrompts'

export default function AIDataModalBasicSection({
  labels,
  shotType,
  cameraMove,
  description,
  location,
  characters,
  videoPrompt,
  onShotTypeChange,
  onCameraMoveChange,
  onDescriptionChange,
  onVideoPromptChange,
}: AIDataModalBasicSectionProps) {
  return (
    <>
      <div className="text-sm font-medium text-[var(--glass-text-secondary)] mb-3">
        {labels.title}
      </div>

      <AIDataModalBasicPrimaryFields
        labels={labels}
        shotType={shotType}
        cameraMove={cameraMove}
        onShotTypeChange={onShotTypeChange}
        onCameraMoveChange={onCameraMoveChange}
      />

      <AIDataModalBasicSceneSummary
        labels={labels}
        location={location}
        characters={characters}
      />

      <AIDataModalBasicPrompts
        labels={labels}
        description={description}
        videoPrompt={videoPrompt}
        onDescriptionChange={onDescriptionChange}
        onVideoPromptChange={onVideoPromptChange}
      />
    </>
  )
}
