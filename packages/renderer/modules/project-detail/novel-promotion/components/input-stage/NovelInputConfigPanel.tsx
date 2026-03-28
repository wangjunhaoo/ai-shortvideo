import { ART_STYLES, VIDEO_RATIOS } from '@/lib/constants'
import { AppIcon } from '@/components/ui/icons'
import { RatioSelector } from './RatioSelector'
import { StyleSelector } from './StyleSelector'

interface NovelInputConfigPanelProps {
  videoRatio: string
  artStyle: string
  onVideoRatioChange?: (value: string) => void
  onArtStyleChange?: (value: string) => void
  labels: NovelInputConfigPanelLabels
}

export interface NovelInputConfigPanelLabels {
  videoRatioLabel: string
  videoRatioHint: string
  visualStyleLabel: string
  visualStyleHint: string
  currentConfigSummaryLabel: (ratio: string, style: string) => string
  assetLibraryRatioNote: string
  moreConfig: string
  recommendedLabel: string
  ratioUsageTextMap: Record<string, string>
  ratioUsageTagMap: Record<string, string>
}

export function NovelInputConfigPanel({
  videoRatio,
  artStyle,
  onVideoRatioChange,
  onArtStyleChange,
  labels,
}: NovelInputConfigPanelProps) {
  const ratioDisplayLabel = (VIDEO_RATIOS.find((option) => option.value === videoRatio) ?? VIDEO_RATIOS[0])?.label
  const artStyleDisplayLabel = (ART_STYLES.find((option) => option.value === artStyle) ?? ART_STYLES[0])?.label
  const getRatioUsageText = (ratio: string): string => labels.ratioUsageTextMap[ratio] ?? labels.videoRatioHint
  const getRatioUsageTag = (ratio: string): string => labels.ratioUsageTagMap[ratio] ?? ''
  const ratioUsageText = getRatioUsageText(videoRatio)

  return (
    <div className="glass-surface p-6 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            <h3 className="text-sm font-semibold text-[var(--glass-text-muted)] tracking-[0.01em]">
              {labels.videoRatioLabel}
            </h3>
            <div className="relative inline-flex items-center group">
              <div className="w-4 h-4 flex items-center justify-center rounded-full bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] shadow-sm">
                <AppIcon name="info" className="w-3 h-3" />
              </div>
              <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 z-20">
                <div
                  className="rounded-lg border bg-[var(--glass-bg-surface-strong)]/95 border-[var(--glass-tone-info-bg)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--glass-text-primary)] shadow-[0_18px_45px_rgba(15,23,42,0.55)] whitespace-pre-wrap"
                  style={{ minWidth: 220 }}
                >
                  {ratioUsageText}
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-[var(--glass-text-tertiary)]">
            {labels.videoRatioHint}
          </p>
          <RatioSelector
            value={videoRatio}
            onChange={(value) => onVideoRatioChange?.(value)}
            options={VIDEO_RATIOS.map((option) => ({
              ...option,
              recommended: option.value === '9:16',
            }))}
            getUsage={getRatioUsageTag}
            recommendedLabel={labels.recommendedLabel}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--glass-text-muted)] tracking-[0.01em]">{labels.visualStyleLabel}</h3>
          <p className="text-xs text-[var(--glass-text-tertiary)]">
            {labels.visualStyleHint}
          </p>
          <StyleSelector
            value={artStyle}
            onChange={(value) => onArtStyleChange?.(value)}
            options={ART_STYLES.map((option) => ({
              ...option,
              recommended: option.value === 'realistic',
            }))}
            recommendedLabel={labels.recommendedLabel}
          />
        </div>
      </div>
      <p className="text-xs text-[var(--glass-text-secondary)] mt-4 text-center">
        {labels.currentConfigSummaryLabel(ratioDisplayLabel, artStyleDisplayLabel)}
      </p>
      <p className="text-xs text-[var(--glass-text-tertiary)] mt-1 text-center">
        {labels.assetLibraryRatioNote}
      </p>
      <p className="text-xs text-[var(--glass-text-tertiary)] mt-1 text-center">
        {labels.moreConfig}
      </p>
    </div>
  )
}
