'use client'

import type { ImageEditModalHeaderProps } from './ImageEditModal.types'

export default function ImageEditModalHeader({
  title,
  subtitle,
}: ImageEditModalHeaderProps) {
  return (
    <div className="p-6 border-b">
      <h3 className="text-lg font-bold text-[var(--glass-text-primary)]">{title}</h3>
      <p className="text-sm text-[var(--glass-text-tertiary)] mt-1">{subtitle}</p>
    </div>
  )
}
