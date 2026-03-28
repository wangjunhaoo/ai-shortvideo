'use client'

import { useEffect, useState } from 'react'
import { resolveTaskPresentationState } from '@/lib/task/presentation'

interface UseInsertPanelModalStateParams {
  isInserting: boolean
  onClose: () => void
  onInsert: (userInput: string) => Promise<void>
}

export function useInsertPanelModalState({
  isInserting,
  onClose,
  onInsert,
}: UseInsertPanelModalStateParams) {
  const [userInput, setUserInput] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const analyzingState = isInserting
    ? resolveTaskPresentationState({
        phase: 'processing',
        intent: 'analyze',
        resource: 'text',
        hasOutput: true,
      })
    : null

  const insertingState = isInserting
    ? resolveTaskPresentationState({
        phase: 'processing',
        intent: 'build',
        resource: 'text',
        hasOutput: true,
      })
    : null

  const resetInput = () => {
    setUserInput('')
  }

  const handleInsert = async () => {
    await onInsert(userInput)
    resetInput()
  }

  const handleAutoAnalyze = async () => {
    await onInsert('')
    resetInput()
  }

  const handleClose = () => {
    if (isInserting) {
      return
    }
    resetInput()
    onClose()
  }

  return {
    userInput,
    setUserInput,
    mounted,
    analyzingState,
    insertingState,
    handleInsert,
    handleAutoAnalyze,
    handleClose,
  }
}
