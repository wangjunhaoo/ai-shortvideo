'use client'

import { useState } from 'react'
import { shouldShowError } from '@/lib/error-utils'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { getErrorMessage } from '../promptStageRuntime.utils'
import type { PromptAppendMessages } from '../promptStageRuntime.types'

interface UsePromptAppendFlowParams {
  onAppendContent?: (content: string) => Promise<void>
  messages: PromptAppendMessages
}

export function usePromptAppendFlow({
  onAppendContent,
  messages,
}: UsePromptAppendFlowParams) {
  const [appendContent, setAppendContent] = useState('')
  const [isAppending, setIsAppending] = useState(false)

  const appendTaskRunningState = isAppending
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'generate',
      resource: 'text',
      hasOutput: false,
    })
    : null

  const handleAppendSubmit = async () => {
    if (!onAppendContent) return
    if (!appendContent.trim()) {
      alert(messages.enterContinuation)
      return
    }

    setIsAppending(true)
    try {
      await onAppendContent(appendContent.trim())
      setAppendContent('')
      alert(messages.appendSuccess)
    } catch (error: unknown) {
      if (shouldShowError(error)) {
        alert(messages.appendFailed(getErrorMessage(error, messages.unknownError)))
      }
    } finally {
      setIsAppending(false)
    }
  }

  return {
    appendContent,
    setAppendContent,
    isAppending,
    appendTaskRunningState,
    handleAppendSubmit,
  }
}
