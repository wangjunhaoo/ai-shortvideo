'use client'

import TaskStatusInline from '@/components/task/TaskStatusInline'
import type { ReturnTypeUseInsertPanelModalState } from './InsertPanelModalState.types'
import type { InsertPanelModalActionLabels } from './InsertPanelModal.types'

interface InsertPanelModalActionsProps {
  labels: InsertPanelModalActionLabels
  isInserting: boolean
  userInput: string
  analyzingState: ReturnTypeUseInsertPanelModalState['analyzingState']
  insertingState: ReturnTypeUseInsertPanelModalState['insertingState']
  onAutoAnalyze: () => Promise<void>
  onInsert: () => Promise<void>
}

export default function InsertPanelModalActions({
  labels,
  isInserting,
  userInput,
  analyzingState,
  insertingState,
  onAutoAnalyze,
  onInsert,
}: InsertPanelModalActionsProps) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onAutoAnalyze}
        disabled={isInserting}
        className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
          isInserting
            ? 'bg-[var(--glass-bg-muted)] text-[var(--glass-text-tertiary)]'
            : 'bg-[var(--glass-bg-muted)] text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-muted)]'
        }`}
      >
        {isInserting && !userInput ? (
          <TaskStatusInline state={analyzingState} />
        ) : (
          <>{labels.aiAnalyzeLabel}</>
        )}
      </button>

      <button
        onClick={onInsert}
        disabled={isInserting || !userInput.trim()}
        className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
          isInserting || !userInput.trim()
            ? 'bg-[var(--glass-bg-muted)] text-[var(--glass-text-tertiary)]'
            : 'bg-[var(--glass-accent-from)] text-white hover:bg-[var(--glass-accent-to)] shadow-[var(--glass-shadow-md)]'
        }`}
      >
        {isInserting && userInput ? (
          <TaskStatusInline state={insertingState} />
        ) : (
          <>{labels.insertLabel}</>
        )}
      </button>
    </div>
  )
}
