'use client'

import { countWords } from '@/lib/word-count'
import type { EpisodeMarkerResult } from '@/lib/episode-marker-detector'
import { AppIcon } from '@/components/ui/icons'
import type { StepSourceLabels } from '../types'

interface StepSourceProps {
  onManualCreate: () => void
  rawContent: string
  onRawContentChange: (content: string) => void
  onAnalyze: () => void
  error: string | null
  showMarkerConfirm: boolean
  markerResult: EpisodeMarkerResult | null
  onCloseMarkerConfirm: () => void
  onUseMarkerSplit: () => void
  onUseAiSplit: () => void
  labels: StepSourceLabels
}

export default function StepSource({
  onManualCreate,
  rawContent,
  onRawContentChange,
  onAnalyze,
  error,
  showMarkerConfirm,
  markerResult,
  onCloseMarkerConfirm,
  onUseMarkerSplit,
  onUseAiSplit,
  labels,
}: StepSourceProps) {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-8">
      {showMarkerConfirm && markerResult && (
        <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50" onClick={onCloseMarkerConfirm}>
          <div className="glass-surface-modal p-6 w-full max-w-lg animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-[var(--glass-tone-info-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
                <AppIcon name="fileText" className="w-7 h-7 text-[var(--glass-tone-info-fg)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--glass-text-primary)] mb-2">{labels.markerDetectedTitle}</h3>
              <p className="text-[var(--glass-text-secondary)]">
                {labels.markerDetectedDescription(
                  markerResult.matches.length,
                  labels.markerTypeLabel(markerResult.markerTypeKey),
                )}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-[var(--glass-text-tertiary)] mb-3">{labels.markerPreviewLabel}</p>
              <div className="bg-[var(--glass-bg-muted)] rounded-xl p-4 max-h-64 overflow-y-auto space-y-2">
                {markerResult.previewSplits.map((split, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-16 font-medium text-[var(--glass-tone-info-fg)]">
                      {labels.episodeLabel(split.number)}
                    </span>
                    <span className="text-[var(--glass-text-secondary)] truncate flex-1">
                      {split.preview || split.title}
                    </span>
                    <span className="flex-shrink-0 text-[var(--glass-text-tertiary)] text-xs">
                      ~{split.wordCount.toLocaleString()}{labels.wordsLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={onUseMarkerSplit}
                className="glass-btn-base glass-btn-primary py-4 px-3 rounded-xl font-bold transition-all flex flex-col items-center gap-1"
              >
                <span>{labels.useMarkerLabel}</span>
                <span className="text-xs font-normal opacity-80">{labels.useMarkerDescription}</span>
              </button>
              <button
                onClick={onUseAiSplit}
                className="py-4 bg-[var(--glass-bg-surface)] border-2 border-[var(--glass-stroke-base)] text-[var(--glass-text-secondary)] rounded-xl font-bold hover:border-[var(--glass-stroke-focus)] hover:bg-[var(--glass-tone-info-bg)] transition-all flex flex-col items-center gap-1"
              >
                <span>{labels.useAiLabel}</span>
                <span className="text-xs font-normal text-[var(--glass-text-tertiary)]">{labels.useAiDescription}</span>
              </button>
            </div>

            <button
              onClick={onCloseMarkerConfirm}
              className="w-full py-2.5 text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)] font-medium transition-colors"
            >
              {labels.cancelLabel}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl w-full">
        <div className="text-center mb-12 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--glass-bg-surface)]/80 rounded-full blur-3xl -z-10"></div>
          <div className="inline-block relative">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
              <span className="text-[var(--glass-tone-info-fg)]">
                {labels.title}
              </span>
            </h1>
          </div>
          <p className="text-[var(--glass-text-tertiary)] text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            {labels.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          <button
            onClick={onManualCreate}
            className="group bg-[var(--glass-bg-surface)] border-2 border-[var(--glass-stroke-base)] hover:border-[var(--glass-stroke-focus)] rounded-2xl p-8 text-left transition-all duration-200 hover:shadow-xl cursor-pointer flex flex-col justify-center"
          >
            <div className="w-16 h-16 bg-[var(--glass-bg-muted)] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[var(--glass-tone-info-bg)] transition-colors duration-200">
              <AppIcon name="edit" className="w-8 h-8 text-[var(--glass-text-secondary)] group-hover:text-[var(--glass-tone-info-fg)] transition-colors duration-200" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-[var(--glass-text-primary)]">{labels.manualCreateTitle}</h3>
            <p className="text-[var(--glass-text-tertiary)] mb-6 leading-relaxed">{labels.manualCreateDescription}</p>
            <div className="flex items-center text-[var(--glass-tone-info-fg)] font-bold">
              <span>{labels.manualCreateButtonLabel}</span>
              <AppIcon name="chevronRight" className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </button>

          <div className="relative rounded-2xl border-2 border-[var(--glass-stroke-base)] bg-[var(--glass-bg-surface)] p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[var(--glass-tone-info-bg)] rounded-xl flex items-center justify-center">
                <AppIcon name="bolt" className="w-6 h-6 text-[var(--glass-tone-info-fg)]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--glass-text-primary)]">{labels.smartImportTitle}</h3>
                <p className="text-sm text-[var(--glass-text-tertiary)]">{labels.smartImportDescription}</p>
              </div>
            </div>

            <div className="flex-grow flex flex-col">
              <textarea
                value={rawContent}
                onChange={(e) => onRawContentChange(e.target.value)}
                className="flex-grow w-full bg-[var(--glass-bg-muted)] border-2 border-[var(--glass-stroke-base)] rounded-xl p-4 text-sm text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)] focus:bg-[var(--glass-bg-surface)] focus:border-[var(--glass-stroke-focus)] focus:ring-4 focus:ring-[var(--glass-tone-info-fg)]/10 outline-none transition-all resize-none leading-relaxed min-h-[180px]"
                placeholder={labels.uploadPlaceholder}
              />

              <div className="mt-4 flex items-center justify-between gap-6">
                <span className="text-sm text-[var(--glass-text-tertiary)] whitespace-nowrap">
                  {countWords(rawContent).toLocaleString()} {labels.wordsLabel} / 30,000
                </span>
                <button
                  onClick={onAnalyze}
                  disabled={!rawContent.trim() || rawContent.length < 100}
                  className="glass-btn-base glass-btn-primary px-5 py-2 rounded-xl font-bold active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  <span>{labels.startAnalysisLabel}</span>
                  <AppIcon name="arrowRightWide" className="w-4 h-4" />
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-[var(--glass-tone-danger-bg)] border border-[var(--glass-stroke-danger)] rounded-lg text-[var(--glass-tone-danger-fg)] text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
