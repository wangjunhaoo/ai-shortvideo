'use client'

interface PanelVariantModalSuggestionEmptyStateProps {
  message: string
}

export default function PanelVariantModalSuggestionEmptyState({
  message,
}: PanelVariantModalSuggestionEmptyStateProps) {
  return (
    <div className="text-center py-8 text-[var(--glass-text-tertiary)] text-sm">
      {message}
    </div>
  )
}
