import type { PromptStageRuntime } from './hooks/usePromptStageActions'
import PromptListCardView from './PromptListCardView'
import PromptListTableView from './PromptListTableView'
import PromptListToolbar from './PromptListToolbar'

interface PromptListPanelProps {
  runtime: PromptStageRuntime
}

export default function PromptListPanel({ runtime }: PromptListPanelProps) {
  const { viewMode } = runtime

  return (
    <>
      <PromptListToolbar runtime={runtime} />

      {viewMode === 'card' ? (
        <PromptListCardView runtime={runtime} />
      ) : (
        <PromptListTableView runtime={runtime} />
      )}
    </>
  )
}
