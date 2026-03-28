'use client'

interface StoryboardCanvasEmptyStateProps {
  title: string
  description: string
}

export default function StoryboardCanvasEmptyState({
  title,
  description,
}: StoryboardCanvasEmptyStateProps) {
  return (
    <div className="text-center py-12 text-[var(--glass-text-tertiary)]">
      <p>{title}</p>
      <p className="text-sm mt-2">{description}</p>
    </div>
  )
}
