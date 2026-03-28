'use client'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { resolveTaskPresentationState } from '@/lib/task/presentation'

interface VoiceToolbarProps {
    onBack?: () => void
    onAddLine: () => void
    onAnalyze: () => void
    onGenerateAll: () => void
    onDownloadAll: () => void
    analyzing: boolean
    isBatchSubmitting: boolean
    runningCount: number
    isDownloading: boolean
    allSpeakersHaveVoice: boolean
    totalLines: number
    linesWithVoice: number
    linesWithAudio: number
    labels: VoiceToolbarLabels
}

export interface VoiceToolbarLabels {
    backLabel: string
    analyzingLabel: string
    analyzeLinesLabel: string
    addLineLabel: string
    uploadReferenceHint: string
    generateAllLabel: string
    noDownloadTitle: string
    downloadCountTitle: (count: number) => string
    downloadAllLabel: string
    statsLabel: (args: { total: number; withVoice: number; withAudio: number }) => string
}

export default function VoiceToolbar({
    onBack,
    onAddLine,
    onAnalyze,
    onGenerateAll,
    onDownloadAll,
    analyzing,
    isBatchSubmitting,
    runningCount,
    isDownloading,
    allSpeakersHaveVoice,
    totalLines,
    linesWithVoice,
    linesWithAudio,
    labels,
}: VoiceToolbarProps) {
    const voiceTaskRunningState = isBatchSubmitting
        ? resolveTaskPresentationState({
            phase: 'processing',
            intent: 'generate',
            resource: 'audio',
            hasOutput: linesWithAudio > 0,
        })
        : null
    const voiceDownloadRunningState = isDownloading
        ? resolveTaskPresentationState({
            phase: 'processing',
            intent: 'process',
            resource: 'audio',
            hasOutput: linesWithAudio > 0,
        })
        : null

    return (
        <div className="glass-surface-elevated p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--glass-bg-surface)] text-[var(--glass-text-secondary)] font-medium rounded-xl border border-[var(--glass-stroke-base)] hover:bg-[var(--glass-bg-muted)] hover:text-[var(--glass-tone-info-fg)] transition-all"
                    >
                        {labels.backLabel}
                    </button>
                    <button
                        onClick={onAnalyze}
                        disabled={analyzing}
                        className="glass-btn-base glass-btn-primary flex items-center gap-2 px-5 py-2.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {analyzing ? labels.analyzingLabel : labels.analyzeLinesLabel}
                    </button>
                    <button
                        onClick={onAddLine}
                        className="glass-btn-base glass-btn-secondary flex items-center gap-2 px-5 py-2.5 font-medium border border-[var(--glass-stroke-base)]"
                    >
                        {labels.addLineLabel}
                    </button>
                    <button
                        onClick={onGenerateAll}
                        disabled={isBatchSubmitting || !allSpeakersHaveVoice || totalLines === 0}
                        className="glass-btn-base glass-btn-tone-success flex items-center gap-2 px-5 py-2.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!allSpeakersHaveVoice ? labels.uploadReferenceHint : ''}
                    >
                        {isBatchSubmitting ? (
                            <>
                                <TaskStatusInline state={voiceTaskRunningState} className="text-white [&>span]:text-white [&_svg]:text-white" />
                                <span className="text-xs text-white/90">({runningCount})</span>
                            </>
                        ) : labels.generateAllLabel}
                    </button>
                    <button
                        onClick={onDownloadAll}
                        disabled={linesWithAudio === 0 || isDownloading}
                        className="glass-btn-base glass-btn-tone-info flex items-center gap-2 px-5 py-2.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        title={linesWithAudio === 0 ? labels.noDownloadTitle : labels.downloadCountTitle(linesWithAudio)}
                    >
                        {isDownloading ? (
                            <TaskStatusInline state={voiceDownloadRunningState} className="text-white [&>span]:text-white [&_svg]:text-white" />
                        ) : labels.downloadAllLabel}
                    </button>
                </div>
                <div className="text-sm text-[var(--glass-text-tertiary)]">
                    {labels.statsLabel({ total: totalLines, withVoice: linesWithVoice, withAudio: linesWithAudio })}
                </div>
            </div>
        </div>
    )
}
