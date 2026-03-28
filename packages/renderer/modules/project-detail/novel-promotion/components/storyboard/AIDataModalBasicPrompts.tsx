'use client'

import type { AIDataModalBasicSectionLabels } from './AIDataModalFormPane.types'

interface AIDataModalBasicPromptsProps {
  labels: Pick<
    AIDataModalBasicSectionLabels,
    | 'visualDescription'
    | 'visualDescriptionPlaceholder'
    | 'videoPrompt'
    | 'videoPromptPlaceholder'
  >
  description: string
  videoPrompt: string
  onDescriptionChange: (value: string) => void
  onVideoPromptChange: (value: string) => void
}

export default function AIDataModalBasicPrompts({
  labels,
  description,
  videoPrompt,
  onDescriptionChange,
  onVideoPromptChange,
}: AIDataModalBasicPromptsProps) {
  return (
    <>
      <div>
        <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">
          {labels.visualDescription}
        </label>
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm resize-none focus:ring-2 focus:ring-[var(--glass-tone-info-fg)] focus:border-[var(--glass-stroke-focus)]"
          placeholder={labels.visualDescriptionPlaceholder}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--glass-text-secondary)] mb-1">
          {labels.videoPrompt}
        </label>
        <textarea
          value={videoPrompt}
          onChange={(event) => onVideoPromptChange(event.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg text-sm resize-none focus:ring-2 focus:ring-[var(--glass-tone-info-fg)] focus:border-[var(--glass-stroke-focus)] bg-[var(--glass-tone-warning-bg)]"
          placeholder={labels.videoPromptPlaceholder}
        />
      </div>
    </>
  )
}
