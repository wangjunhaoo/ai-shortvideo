'use client'

import type { AIDataModalBasicSectionLabels } from './AIDataModalFormPane.types'

interface AIDataModalBasicPrimaryFieldsProps {
  labels: Pick<
    AIDataModalBasicSectionLabels,
    'shotType' | 'shotTypePlaceholder' | 'cameraMove' | 'cameraMovePlaceholder'
  >
  shotType: string
  cameraMove: string
  onShotTypeChange: (value: string) => void
  onCameraMoveChange: (value: string) => void
}

export default function AIDataModalBasicPrimaryFields({
  labels,
  shotType,
  cameraMove,
  onShotTypeChange,
  onCameraMoveChange,
}: AIDataModalBasicPrimaryFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">
          {labels.shotType}
        </label>
        <input
          type="text"
          value={shotType}
          onChange={(event) => onShotTypeChange(event.target.value)}
          className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--glass-tone-info-fg)] focus:border-[var(--glass-stroke-focus)]"
          placeholder={labels.shotTypePlaceholder}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">
          {labels.cameraMove}
        </label>
        <input
          type="text"
          value={cameraMove}
          onChange={(event) => onCameraMoveChange(event.target.value)}
          className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--glass-tone-info-fg)] focus:border-[var(--glass-stroke-focus)]"
          placeholder={labels.cameraMovePlaceholder}
        />
      </div>
    </div>
  )
}
