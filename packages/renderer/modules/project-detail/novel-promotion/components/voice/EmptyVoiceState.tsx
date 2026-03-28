'use client'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { AppIcon } from '@/components/ui/icons'

interface EmptyVoiceStateProps {
    onAnalyze: () => void
    analyzing: boolean
    labels: EmptyVoiceStateLabels
}

export interface EmptyVoiceStateLabels {
    title: string
    description: string
    analyzeButtonLabel: string
    hint: string
}

export default function EmptyVoiceState({
    onAnalyze,
    analyzing,
    labels,
}: EmptyVoiceStateProps) {
    const analyzingState = analyzing
        ? resolveTaskPresentationState({
            phase: 'processing',
            intent: 'analyze',
            resource: 'text',
            hasOutput: false,
        })
        : null

    return (
        <div className="glass-surface-elevated p-10 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)]">
                <AppIcon name="micOutline" className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-[var(--glass-text-secondary)] mb-2">{labels.title}</h3>
            <p className="text-[var(--glass-text-tertiary)] mb-6">{labels.description}</p>
            <button
                onClick={onAnalyze}
                disabled={analyzing}
                className="glass-btn-base glass-btn-primary inline-flex items-center gap-2 px-6 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {analyzing ? (
                    <TaskStatusInline state={analyzingState} className="text-white [&>span]:text-white [&_svg]:text-white" />
                ) : (
                    <>
                        <AppIcon name="clipboardCheck" className="w-5 h-5" />
                        {labels.analyzeButtonLabel}
                    </>
                )}
            </button>
            <p className="text-sm text-[var(--glass-text-tertiary)] mt-6">
                {labels.hint}
            </p>
        </div>
    )
}
