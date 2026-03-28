'use client'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { resolveTaskPresentationState } from '@/lib/task/presentation'

interface EmbeddedVoiceToolbarProps {
    totalLines: number
    linesWithAudio: number
    analyzing: boolean
    isDownloading: boolean
    isBatchSubmitting: boolean
    runningCount: number
    allSpeakersHaveVoice: boolean
    onAddLine: () => void
    onAnalyze: () => void
    onDownloadAll: () => void
    onGenerateAll: () => void
    labels: EmbeddedVoiceToolbarLabels
}

export interface EmbeddedVoiceToolbarLabels {
    linesStatsLabel: (args: { total: number; audio: number }) => string
    reanalyzeHint: string
    analyzeHint: string
    reanalyzeLabel: string
    analyzeLinesLabel: string
    addLineLabel: string
    noDownloadTitle: string
    downloadCountTitle: (count: number) => string
    downloadVoiceLabel: string
    generatingHint: string
    noVoiceHint: string
    noLinesHint: string
    allDoneHint: string
    generateHint: (count: number) => string
    generatingProgressLabel: (args: { current: number; total: number }) => string
    generateAllVoiceLabel: string
    pendingCountLabel: (count: number) => string
}

export default function EmbeddedVoiceToolbar({
    totalLines,
    linesWithAudio,
    analyzing,
    isDownloading,
    isBatchSubmitting,
    runningCount,
    allSpeakersHaveVoice,
    onAddLine,
    onAnalyze,
    onDownloadAll,
    onGenerateAll,
    labels,
}: EmbeddedVoiceToolbarProps) {
    const voiceTaskRunningState = isBatchSubmitting
        ? resolveTaskPresentationState({
            phase: 'processing',
            intent: 'generate',
            resource: 'audio',
            hasOutput: linesWithAudio > 0,
        })
        : null
    const voiceAnalyzingState = analyzing
        ? resolveTaskPresentationState({
            phase: 'processing',
            intent: 'generate',
            resource: 'text',
            hasOutput: false,
        })
        : null
    const voiceDownloadingState = isDownloading
        ? resolveTaskPresentationState({
            phase: 'processing',
            intent: 'generate',
            resource: 'audio',
            hasOutput: linesWithAudio > 0,
        })
        : null

    const getGenerateButtonTitle = () => {
        if (isBatchSubmitting) return labels.generatingHint
        if (!allSpeakersHaveVoice) return labels.noVoiceHint
        if (totalLines === 0) return labels.noLinesHint
        if (linesWithAudio >= totalLines) return labels.allDoneHint
        return labels.generateHint(totalLines - linesWithAudio)
    }

    return (
        <div className="flex items-center justify-end mb-3 px-4">
            <div className="flex items-center gap-3">
                <div className="text-xs text-[var(--glass-text-tertiary)]">
                    {labels.linesStatsLabel({ total: totalLines, audio: linesWithAudio })}
                </div>

                {/* 重新分析按钮 */}
                <button
                    onClick={onAnalyze}
                    disabled={analyzing}
                    className="glass-btn-base glass-btn-primary flex items-center gap-2 px-4 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title={totalLines > 0 ? labels.reanalyzeHint : labels.analyzeHint}
                >
                    {analyzing ? (
                        <TaskStatusInline state={voiceAnalyzingState} className="text-white [&>span]:text-white [&_svg]:text-white" />
                    ) : totalLines > 0 ? labels.reanalyzeLabel : labels.analyzeLinesLabel}
                </button>

                <button
                    onClick={onAddLine}
                    className="glass-btn-base glass-btn-secondary flex items-center gap-2 px-4 py-2 font-medium border border-[var(--glass-stroke-base)]"
                >
                    {labels.addLineLabel}
                </button>

                {/* 下载按钮 */}
                <button
                    onClick={onDownloadAll}
                    disabled={linesWithAudio === 0 || isDownloading}
                    className="glass-btn-base glass-btn-tone-info flex items-center gap-2 px-4 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title={linesWithAudio === 0 ? labels.noDownloadTitle : labels.downloadCountTitle(linesWithAudio)}
                >
                    {isDownloading ? (
                        <TaskStatusInline state={voiceDownloadingState} className="text-white [&>span]:text-white [&_svg]:text-white" />
                    ) : (
                        <>{labels.downloadVoiceLabel}</>
                    )}
                </button>

                {/* 生成全部按钮 */}
                <button
                    onClick={onGenerateAll}
                    disabled={isBatchSubmitting || !allSpeakersHaveVoice || totalLines === 0}
                    className="glass-btn-base glass-btn-tone-success flex items-center gap-2 px-4 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title={getGenerateButtonTitle()}
                >
                    {isBatchSubmitting ? (
                        <>
                            <TaskStatusInline state={voiceTaskRunningState} className="text-white [&>span]:text-white [&_svg]:text-white" />
                            <span className="text-xs text-white/90">{labels.generatingProgressLabel({ current: runningCount, total: totalLines - linesWithAudio })}</span>
                        </>
                    ) : (
                        <>
                            {labels.generateAllVoiceLabel}
                            {linesWithAudio > 0 && (
                                <span className="text-xs opacity-75">{labels.pendingCountLabel(totalLines - linesWithAudio)}</span>
                            )}
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
