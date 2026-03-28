import type { PromptStageRuntime } from './hooks/usePromptStageActions'
import PromptAppendSection from './PromptAppendSection'
import PromptStageNextButton from './PromptStageNextButton'

interface PromptEditorPanelProps {
  runtime: PromptStageRuntime
}

export default function PromptEditorPanel({ runtime }: PromptEditorPanelProps) {
  return (
    <>
      <PromptAppendSection runtime={runtime} />
      <PromptStageNextButton runtime={runtime} />
    </>
  )
}
