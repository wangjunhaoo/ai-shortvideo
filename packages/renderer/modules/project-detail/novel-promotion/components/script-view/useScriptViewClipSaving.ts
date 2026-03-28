import { useState } from 'react'
import type { Clip } from './types'

interface UseScriptViewClipSavingInput {
  onClipUpdate?: (clipId: string, data: Partial<Clip>) => void | Promise<void>
}

export function useScriptViewClipSaving({
  onClipUpdate,
}: UseScriptViewClipSavingInput) {
  const [savingClips, setSavingClips] = useState<Set<string>>(new Set())

  const handleClipUpdateWithSaving = async (clipId: string, data: Partial<Clip>) => {
    if (!onClipUpdate) return

    setSavingClips((prev) => new Set(prev).add(clipId))
    try {
      await onClipUpdate(clipId, data)
    } finally {
      setTimeout(() => {
        setSavingClips((prev) => {
          const next = new Set(prev)
          next.delete(clipId)
          return next
        })
      }, 500)
    }
  }

  return {
    savingClips,
    handleClipUpdateWithSaving,
  }
}
