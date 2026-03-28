'use client'

import { useCallback } from 'react'
import type { NovelPromotionStoryboard } from '@/types/project'
import { extractErrorMessage } from '@/lib/errors/extract'

interface DownloadImagesMutationLike {
  mutateAsync: (payload: { episodeId: string }) => Promise<Blob>
}

interface UsePanelImageDownloadParams {
  localStoryboards: NovelPromotionStoryboard[]
  downloadImagesMutation: DownloadImagesMutationLike
  setIsDownloadingImages: React.Dispatch<React.SetStateAction<boolean>>
  messages: PanelImageDownloadMessages
}

export interface PanelImageDownloadMessages {
  episodeNotFound: string
  unknownError: string
  downloadFailed: (error: string) => string
}

export function usePanelImageDownload({
  localStoryboards,
  downloadImagesMutation,
  setIsDownloadingImages,
  messages,
}: UsePanelImageDownloadParams) {
  const downloadAllImages = useCallback(async () => {
    const firstEpisodeId = localStoryboards[0]?.episodeId
    if (!firstEpisodeId) {
      alert(messages.episodeNotFound)
      return
    }

    setIsDownloadingImages(true)
    try {
      const blob = await downloadImagesMutation.mutateAsync({ episodeId: firstEpisodeId })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'images.zip'
      document.body.appendChild(anchor)
      anchor.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(anchor)
    } catch (error: unknown) {
      alert(messages.downloadFailed(extractErrorMessage(error, messages.unknownError)))
    } finally {
      setIsDownloadingImages(false)
    }
  }, [downloadImagesMutation, localStoryboards, messages, setIsDownloadingImages])

  return {
    downloadAllImages,
  }
}
