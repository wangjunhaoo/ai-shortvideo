import type { PromptStageRuntime } from './hooks/usePromptStageActions'

interface PromptStageNextButtonProps {
  runtime: PromptStageRuntime
}

export default function PromptStageNextButton({ runtime }: PromptStageNextButtonProps) {
  const { onNext, isAnyTaskRunning, labels } = runtime

  return (
    <div className="flex justify-end items-center pt-4">
      <button
        onClick={onNext}
        disabled={isAnyTaskRunning}
        className="glass-btn-base px-6 py-2 bg-[var(--glass-accent-from)] text-white hover:bg-[var(--glass-accent-to)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {labels.nextButton.enterVideoGenerationLabel}
      </button>
    </div>
  )
}
