'use client'

import StoryboardGroupChromeMainRow from './StoryboardGroupChromeMainRow'
import StoryboardGroupChromeStatus from './StoryboardGroupChromeStatus'
import type { StoryboardGroupChromeProps } from './StoryboardGroupChrome.types'
import { useStoryboardGroupChromeSectionProps } from './hooks/useStoryboardGroupChromeSectionProps'

export default function StoryboardGroupChrome(props: StoryboardGroupChromeProps) {
  const { statusProps, mainRowProps } = useStoryboardGroupChromeSectionProps({
    ...props,
  })

  return (
    <>
      <StoryboardGroupChromeStatus {...statusProps} />
      <StoryboardGroupChromeMainRow {...mainRowProps} />
    </>
  )
}
