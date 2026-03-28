'use client'

import { MediaImageWithLoading } from '@/components/media/MediaImageWithLoading'
import TaskStatusOverlay from '@/components/task/TaskStatusOverlay'
import { resolveTaskPresentationState } from '@/lib/task/presentation'

interface ImageSectionLoadingStateProps {
  alt: string
  intent: 'generate' | 'regenerate' | 'modify' | 'process'
  backdropImageUrl?: string | null
}

export default function ImageSectionLoadingState({
  alt,
  intent,
  backdropImageUrl = null,
}: ImageSectionLoadingStateProps) {
  const state = resolveTaskPresentationState({
    phase: 'processing',
    intent,
    resource: 'image',
    hasOutput: !!backdropImageUrl,
  })

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[var(--glass-bg-surface-modal)] backdrop-blur-md group/loading">
      {backdropImageUrl && (
        <MediaImageWithLoading
          src={backdropImageUrl}
          alt={alt}
          containerClassName="absolute inset-0 h-full w-full"
          className="absolute inset-0 h-full w-full object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      )}
      <div
        className={`absolute inset-0 ${
          backdropImageUrl
            ? 'bg-black/45 backdrop-blur-[1px]'
            : 'bg-[var(--glass-bg-surface-modal)] backdrop-blur-md'
        }`}
      />
      <TaskStatusOverlay
        state={state}
        className={backdropImageUrl ? 'bg-black/45 backdrop-blur-[1px]' : undefined}
      />
    </div>
  )
}
