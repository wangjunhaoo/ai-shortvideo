interface CurrentEpisodeBannerProps {
  episodeName?: string
  labels: CurrentEpisodeBannerLabels
}

export interface CurrentEpisodeBannerLabels {
  currentEditingLabel: (name: string) => string
  editingTip: string
}

export function CurrentEpisodeBanner({ episodeName, labels }: CurrentEpisodeBannerProps) {
  if (!episodeName) {
    return null
  }

  return (
    <div className="text-center py-1">
      <div className="text-lg font-semibold text-[var(--glass-text-primary)]">
        {labels.currentEditingLabel(episodeName)}
      </div>
      <div className="text-sm text-[var(--glass-text-tertiary)] mt-1">{labels.editingTip}</div>
    </div>
  )
}
