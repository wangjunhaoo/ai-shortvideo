'use client'

import { VideoPanel } from './types'
import { AppIcon } from '@/components/ui/icons'
import { useVideoPromptModalLabels } from './useVideoPromptModalLabels'

interface VideoPromptModalProps {
  panel: VideoPanel | undefined
  panelIndex: number
  editValue: string
  onEditValueChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
}

export default function VideoPromptModal({
  panel,
  panelIndex,
  editValue,
  onEditValueChange,
  onSave,
  onCancel
}: VideoPromptModalProps) {
  const labels = useVideoPromptModalLabels()
  if (!panel) return null

  return (
    <div className="fixed inset-0 bg-[var(--glass-overlay)] flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-[var(--glass-bg-surface)] rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="sticky top-0 bg-[var(--glass-bg-surface)] border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{labels.title(panelIndex + 1)}</h3>
          <button onClick={onCancel} className="text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)]">
            <AppIcon name="close" className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* 镜头信息 */}
          <div className="p-3 bg-[var(--glass-bg-muted)] rounded-lg text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[var(--glass-text-tertiary)]">{labels.shotTypeLabel}</span>
              <span className="px-2 py-0.5 bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] rounded">{panel.textPanel?.shot_type}</span>
              {panel.textPanel?.camera_move && (
                <span className="px-2 py-0.5 bg-[var(--glass-tone-warning-bg)] text-[var(--glass-tone-warning-fg)] rounded">{panel.textPanel.camera_move}</span>
              )}
              {panel.textPanel?.duration && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--glass-bg-muted)] text-[var(--glass-text-secondary)] rounded">
                  <AppIcon name="clock" className="w-3 h-3" />
                  {panel.textPanel.duration}
                  {labels.durationSuffix}
                </span>
              )}
            </div>
            <div><span className="text-[var(--glass-text-tertiary)]">{labels.locationLabel}</span>{panel.textPanel?.location || labels.locationUnknownLabel}</div>
            <div><span className="text-[var(--glass-text-tertiary)]">{labels.charactersLabel}</span>{panel.textPanel?.characters?.join('、') || labels.charactersNoneLabel}</div>
            <div><span className="text-[var(--glass-text-tertiary)]">{labels.descriptionLabel}</span>{panel.textPanel?.description}</div>
            {panel.textPanel?.text_segment && (
              <div className="border-t pt-2 mt-2">
                <span className="text-[var(--glass-text-tertiary)]">{labels.textLabel}</span>
                <span className="text-[var(--glass-text-secondary)] italic">&quot;{panel.textPanel.text_segment}&quot;</span>
              </div>
            )}
          </div>

          {/* 视频提示词编辑 */}
          <div>
            <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">
              {labels.promptLabel}
            </label>
            <textarea
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg focus:ring-2 focus:ring-[var(--glass-tone-info-fg)] focus:border-[var(--glass-stroke-focus)]"
              rows={6}
              placeholder={labels.promptPlaceholder}
            />
            <p className="text-xs text-[var(--glass-text-tertiary)] mt-1">
              {labels.tip}
            </p>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onCancel}
              className="glass-btn-base px-4 py-2 bg-[var(--glass-bg-muted)] text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-muted)]"
            >
              {labels.cancelLabel}
            </button>
            <button
              onClick={onSave}
              className="glass-btn-base px-4 py-2 bg-[var(--glass-accent-from)] text-white hover:bg-[var(--glass-accent-to)]"
            >
              {labels.saveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
