'use client'

import TaskStatusInline from '@/components/task/TaskStatusInline'
import type { TaskPresentationState } from '@/lib/task/presentation'
import type { PanelVariantModalFooterLabels } from './PanelVariantModal.types'

interface PanelVariantModalFooterProps {
  labels: PanelVariantModalFooterLabels
  isSubmittingVariantTask: boolean
  isAnalyzing: boolean
  customInput: string
  variantTaskRunningState: TaskPresentationState | null
  onClose: () => void
  onSubmitCustom: () => void
}

export default function PanelVariantModalFooter({
  labels,
  isSubmittingVariantTask,
  isAnalyzing,
  customInput,
  variantTaskRunningState,
  onClose,
  onSubmitCustom,
}: PanelVariantModalFooterProps) {
  return (
    <div className="px-5 py-3 border-t border-[var(--glass-stroke-base)] flex justify-end gap-3">
      <button
        onClick={onClose}
        disabled={isSubmittingVariantTask || isAnalyzing}
        className="glass-btn-base glass-btn-secondary px-4 py-2 text-sm disabled:opacity-50"
      >
        {labels.cancelLabel}
      </button>
      <button
        onClick={onSubmitCustom}
        disabled={isSubmittingVariantTask || !customInput.trim()}
        className={`glass-btn-base px-4 py-2 text-sm rounded-lg ${isSubmittingVariantTask || !customInput.trim() ? 'glass-btn-soft text-[var(--glass-text-tertiary)] cursor-not-allowed' : 'glass-btn-primary text-white'}`}
      >
        {isSubmittingVariantTask ? (
          <TaskStatusInline
            state={variantTaskRunningState}
            className="text-[var(--glass-text-tertiary)] [&>span]:text-[var(--glass-text-tertiary)] [&_svg]:text-[var(--glass-text-tertiary)]"
          />
        ) : labels.submitLabel}
      </button>
    </div>
  )
}
