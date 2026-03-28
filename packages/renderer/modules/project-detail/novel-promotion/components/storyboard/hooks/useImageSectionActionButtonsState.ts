'use client'

import { logInfo as _ulogInfo } from '@/lib/logging/core'
import { useImageGenerationCount } from '@/lib/image-generation/use-image-generation-count'

interface UseImageSectionActionButtonsStateParams {
  panelId: string
  isSubmittingPanelImageTask: boolean
  onRegeneratePanelImage: (
    panelId: string,
    count?: number,
    force?: boolean,
  ) => void
  triggerPulse: () => void
}

export function useImageSectionActionButtonsState({
  panelId,
  isSubmittingPanelImageTask,
  onRegeneratePanelImage,
  triggerPulse,
}: UseImageSectionActionButtonsStateParams) {
  const { count, setCount } = useImageGenerationCount('storyboard-candidates')

  const handleRegenerate = () => {
    _ulogInfo('[ImageSection] 🔄 左下角重新生成按钮被点击')
    _ulogInfo('[ImageSection] isSubmittingPanelImageTask:', isSubmittingPanelImageTask)
    _ulogInfo('[ImageSection] 将传递 force:', isSubmittingPanelImageTask)
    triggerPulse()
    onRegeneratePanelImage(panelId, count, isSubmittingPanelImageTask)
  }

  return {
    count,
    setCount,
    handleRegenerate,
  }
}
