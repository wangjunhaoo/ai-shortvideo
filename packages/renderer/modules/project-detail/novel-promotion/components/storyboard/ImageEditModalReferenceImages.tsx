'use client'

import { MediaImageWithLoading } from '@/components/media/MediaImageWithLoading'
import { AppIcon } from '@/components/ui/icons'
import type { ImageEditModalReferenceImagesProps } from './ImageEditModal.types'

export default function ImageEditModalReferenceImages({
  labels,
  editImages,
  fileInputRef,
  onImageUpload,
  onRemoveImage,
}: ImageEditModalReferenceImagesProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">
        {labels.title}{' '}
        <span className="text-[var(--glass-text-tertiary)] font-normal">
          {labels.hint}
        </span>
      </label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onImageUpload}
        className="hidden"
      />
      <div className="flex flex-wrap gap-2">
        {editImages.map((image, index) => (
          <div key={index} className="relative w-16 h-16">
            <MediaImageWithLoading
              src={image}
              alt=""
              containerClassName="w-full h-full rounded-lg"
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={() => onRemoveImage(index)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--glass-tone-danger-fg)] text-white rounded-full text-xs flex items-center justify-center hover:bg-[var(--glass-tone-danger-fg)]"
            >
              <AppIcon name="closeSm" className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-16 h-16 border-2 border-dashed border-[var(--glass-stroke-strong)] rounded-lg flex items-center justify-center text-[var(--glass-text-tertiary)] hover:border-[var(--glass-stroke-focus)] hover:text-[var(--glass-tone-info-fg)] transition-colors"
        >
          <AppIcon name="plus" className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
