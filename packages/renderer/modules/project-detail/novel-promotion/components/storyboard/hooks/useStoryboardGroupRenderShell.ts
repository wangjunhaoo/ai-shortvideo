'use client'

import { useMemo, type ComponentProps } from 'react'
import StoryboardGroupClipSection from '../StoryboardGroupClipSection'
import type { StoryboardGroupProps } from '../StoryboardGroup.types'

interface UseStoryboardGroupRenderShellParams {
  clip: StoryboardGroupProps['clip']
  isExpanded: StoryboardGroupProps['isExpanded']
  clipSectionLabels: ComponentProps<typeof StoryboardGroupClipSection>['labels']
  onToggleExpand: StoryboardGroupProps['onToggleExpand']
  failedError: StoryboardGroupProps['failedError']
}

export function useStoryboardGroupRenderShell({
  clip,
  isExpanded,
  clipSectionLabels,
  onToggleExpand,
  failedError,
}: UseStoryboardGroupRenderShellParams) {
  const clipSectionProps = useMemo(() => {
    if (!clip) {
      return null
    }

    return {
      clip,
      isExpanded,
      labels: clipSectionLabels,
      onToggleExpand,
    } satisfies ComponentProps<typeof StoryboardGroupClipSection>
  }, [clip, clipSectionLabels, isExpanded, onToggleExpand])

  const containerClassName = useMemo(
    () =>
      `glass-surface-elevated p-6 relative ${
        failedError
          ? 'border-2 border-[var(--glass-stroke-danger)] bg-[var(--glass-danger-ring)]'
          : ''
      }`,
    [failedError],
  )

  return {
    containerClassName,
    clipSectionProps,
  }
}
