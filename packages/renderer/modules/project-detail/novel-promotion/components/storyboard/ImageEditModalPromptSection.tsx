'use client'

import type { ImageEditModalPromptSectionProps } from './ImageEditModal.types'

export default function ImageEditModalPromptSection({
  label,
  placeholder,
  value,
  onChange,
}: ImageEditModalPromptSectionProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full h-24 px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg focus:ring-2 focus:ring-[var(--glass-tone-info-fg)] focus:border-[var(--glass-stroke-focus)] resize-none"
        autoFocus
      />
    </div>
  )
}
