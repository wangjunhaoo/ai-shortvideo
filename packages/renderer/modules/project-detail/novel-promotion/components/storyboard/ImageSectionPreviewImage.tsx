'use client'

import { MediaImageWithLoading } from '@/components/media/MediaImageWithLoading'

interface ImageSectionPreviewImageProps {
  imageUrl: string
  shotNumberLabel: string
  previewTitle: string
  onPreviewImage?: (url: string) => void
}

export default function ImageSectionPreviewImage({
  imageUrl,
  shotNumberLabel,
  previewTitle,
  onPreviewImage,
}: ImageSectionPreviewImageProps) {
  return (
    <MediaImageWithLoading
      src={imageUrl}
      alt={shotNumberLabel}
      containerClassName="h-full w-full"
      className={`w-full h-full object-cover ${
        onPreviewImage ? 'cursor-zoom-in' : ''
      }`}
      onClick={onPreviewImage ? () => onPreviewImage(imageUrl) : undefined}
      title={onPreviewImage ? previewTitle : undefined}
      sizes="(max-width: 768px) 100vw, 33vw"
    />
  )
}
