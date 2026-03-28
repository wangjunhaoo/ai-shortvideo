'use client'

import type { ScreenplayDisplayLabels, ScreenplayDisplayTab } from './ScreenplayDisplay.types'

interface ScreenplayDisplayTabsProps {
  labels: ScreenplayDisplayLabels['tabs']
  activeTab: ScreenplayDisplayTab
  onTabChange: (tab: ScreenplayDisplayTab) => void
}

export default function ScreenplayDisplayTabs({
  labels,
  activeTab,
  onTabChange,
}: ScreenplayDisplayTabsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onTabChange('screenplay')}
        className={`glass-btn-base rounded-xl px-3 py-1.5 text-sm ${
          activeTab === 'screenplay'
            ? 'glass-btn-secondary text-[var(--glass-text-secondary)]'
            : 'glass-btn-soft'
        }`}
      >
        {labels.formatted}
      </button>
      <button
        onClick={() => onTabChange('original')}
        className={`glass-btn-base rounded-xl px-3 py-1.5 text-sm ${
          activeTab === 'original'
            ? 'glass-btn-secondary text-[var(--glass-text-secondary)]'
            : 'glass-btn-soft'
        }`}
      >
        {labels.original}
      </button>
    </div>
  )
}
