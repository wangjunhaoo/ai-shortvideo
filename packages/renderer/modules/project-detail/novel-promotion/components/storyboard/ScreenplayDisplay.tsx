'use client'

import ScreenplayDisplayTabs from './ScreenplayDisplayTabs'
import ScreenplaySceneBlock from './ScreenplaySceneBlock'
import type { ScreenplayDisplayProps } from './ScreenplayDisplay.types'
import { useScreenplayDisplayState } from './hooks/useScreenplayDisplayState'

export default function ScreenplayDisplay({
  screenplay,
  originalContent,
  labels,
}: ScreenplayDisplayProps) {
  const { activeTab, setActiveTab, parsedScreenplay } =
    useScreenplayDisplayState({ screenplay })

  return (
    <div className="space-y-3">
      <ScreenplayDisplayTabs
        labels={labels.tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="glass-surface-soft p-4 max-h-96 overflow-y-auto">
        {activeTab === 'screenplay' && parsedScreenplay ? (
          <div className="space-y-3">
            {parsedScreenplay.scenes.map((scene, sceneIndex) => (
              <ScreenplaySceneBlock
                key={sceneIndex}
                labels={labels.scene}
                scene={scene}
                sceneLabel={labels.scene.formatSceneLabel(scene.scene_number)}
              />
            ))}
          </div>
        ) : activeTab === 'screenplay' && !parsedScreenplay ? (
          <div className="text-center text-[var(--glass-text-tertiary)] py-8">
            <p>{labels.parseFailedTitle}</p>
            <p className="text-xs mt-1">
              {labels.parseFailedDescription}
            </p>
          </div>
        ) : (
          <div className="text-sm text-[var(--glass-text-secondary)] whitespace-pre-wrap leading-relaxed">
            {originalContent}
          </div>
        )}
      </div>
    </div>
  )
}
