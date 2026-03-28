import type { LLMStageViewItem } from '@/components/llm-console/LLMStageStreamCard'

export type RunStreamStep = {
  id: string
  title?: string
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'blocked' | 'stale'
  retryable?: boolean
}

export type RunStreamState = {
  status?: 'idle' | 'running' | 'completed' | 'failed'
  isVisible: boolean
  isRecoveredRunning: boolean
  stages: LLMStageViewItem[]
  selectedStep?: RunStreamStep | null
  activeStepId?: string | null
  outputText: string
  activeMessage?: string
  overallProgress: number
  isRunning: boolean
  errorMessage?: string
  stop: () => void
  reset: () => void
  selectStep: (stepId: string) => void
  retryStep: (params: { stepId: string; modelOverride?: string; reason?: string }) => Promise<{
    runId: string
    status: string
    summary: Record<string, unknown> | null
    payload: Record<string, unknown> | null
    errorMessage: string
  }>
}
