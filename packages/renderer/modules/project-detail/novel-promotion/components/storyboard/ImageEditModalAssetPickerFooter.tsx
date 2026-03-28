'use client'

interface ImageEditModalAssetPickerFooterProps {
  confirmLabel: string
  onClose: () => void
}

export default function ImageEditModalAssetPickerFooter({
  confirmLabel,
  onClose,
}: ImageEditModalAssetPickerFooterProps) {
  return (
    <div className="p-4 border-t flex justify-end">
      <button
        onClick={onClose}
        className="px-4 py-2 bg-[var(--glass-accent-from)] text-white rounded-lg hover:bg-[var(--glass-accent-to)]"
      >
        {confirmLabel}
      </button>
    </div>
  )
}
