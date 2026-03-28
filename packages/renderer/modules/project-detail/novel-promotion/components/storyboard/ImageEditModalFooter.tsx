'use client'

import type { ImageEditModalFooterProps } from './ImageEditModal.types'

export default function ImageEditModalFooter({
  cancelLabel,
  submitLabel,
  isSubmitDisabled,
  onClose,
  onSubmit,
}: ImageEditModalFooterProps) {
  return (
    <div className="p-6 border-t flex justify-end gap-3">
      <button
        onClick={onClose}
        className="px-4 py-2 text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-muted)] rounded-lg transition-colors"
      >
        {cancelLabel}
      </button>
      <button
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        className="px-4 py-2 bg-[var(--glass-accent-from)] text-white rounded-lg hover:bg-[var(--glass-accent-to)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitLabel}
      </button>
    </div>
  )
}
