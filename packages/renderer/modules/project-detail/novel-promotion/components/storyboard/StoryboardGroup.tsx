'use client'

import StoryboardGroupChrome from './StoryboardGroupChrome'
import StoryboardGroupClipSection from './StoryboardGroupClipSection'
import StoryboardPanelList from './StoryboardPanelList'
import StoryboardGroupDialogs from './StoryboardGroupDialogs'
import { useStoryboardGroupLabels } from './hooks/useStoryboardGroupLabels'
import { useStoryboardGroupRuntime } from './hooks/useStoryboardGroupRuntime'
import type { StoryboardGroupProps } from './StoryboardGroup.types'

export default function StoryboardGroup(props: StoryboardGroupProps) {
  const labels = useStoryboardGroupLabels()
  const { renderShell, sections } = useStoryboardGroupRuntime(props, labels)

  return (
    <div className={renderShell.containerClassName}>
      <StoryboardGroupChrome {...sections.chromeProps} />

      {renderShell.clipSectionProps ? (
        <StoryboardGroupClipSection {...renderShell.clipSectionProps} />
      ) : null}

      <StoryboardPanelList {...sections.panelListProps} />

      <StoryboardGroupDialogs {...sections.dialogsProps} />
    </div>
  )
}
