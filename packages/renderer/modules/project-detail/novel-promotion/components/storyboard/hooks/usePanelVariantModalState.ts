'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { useAnalyzeProjectShotVariants } from '@renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionOperations'
import type {
  PanelInfo,
  PanelVariantModalStateMessages,
  ShotVariantSuggestion,
} from '../PanelVariantModal.types'

interface UsePanelVariantModalStateParams {
  isOpen: boolean
  panel: PanelInfo
  projectId: string
  messages: PanelVariantModalStateMessages
  onClose: () => void
  onVariant: (
    variant: Omit<ShotVariantSuggestion, 'id' | 'creative_score'>,
    options: { includeCharacterAssets: boolean; includeLocationAsset: boolean },
  ) => Promise<void>
  isSubmittingVariantTask: boolean
}

export function usePanelVariantModalState({
  isOpen,
  panel,
  projectId,
  messages,
  onClose,
  onVariant,
  isSubmittingVariantTask,
}: UsePanelVariantModalStateParams) {
  const [mounted, setMounted] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState<ShotVariantSuggestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [customInput, setCustomInput] = useState('')
  const [includeCharacterAssets, setIncludeCharacterAssets] = useState(true)
  const [includeLocationAsset, setIncludeLocationAsset] = useState(true)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const autoAnalyzeKeyRef = useRef<string | null>(null)
  const analyzingRef = useRef(false)
  const analyzeShotVariantsMutation = useAnalyzeProjectShotVariants(projectId)

  useEffect(() => {
    setMounted(true)
  }, [])

  const analyzeShotVariants = useCallback(async () => {
    if (analyzingRef.current) return
    analyzingRef.current = true
    setIsAnalyzing(true)
    setError(null)
    setSuggestions([])

    try {
      const data = await analyzeShotVariantsMutation.mutateAsync({ panelId: panel.id })
      setSuggestions(data.suggestions || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : messages.analyzeFailed)
    } finally {
      setIsAnalyzing(false)
      analyzingRef.current = false
    }
  }, [analyzeShotVariantsMutation, messages.analyzeFailed, panel.id])

  useEffect(() => {
    if (!isOpen || !panel.imageUrl) return
    const autoAnalyzeKey = `${panel.id}:${panel.imageUrl}`
    if (autoAnalyzeKeyRef.current === autoAnalyzeKey) return
    autoAnalyzeKeyRef.current = autoAnalyzeKey
    void analyzeShotVariants()
  }, [analyzeShotVariants, isOpen, panel.id, panel.imageUrl])

  useEffect(() => {
    if (isOpen) return
    autoAnalyzeKeyRef.current = null
    analyzingRef.current = false
  }, [isOpen])

  const handleSelectVariant = useCallback(async (suggestion: ShotVariantSuggestion) => {
    setSelectedVariantId(suggestion.id)
    await onVariant(
      {
        title: suggestion.title,
        description: suggestion.description,
        shot_type: suggestion.shot_type,
        camera_move: suggestion.camera_move,
        video_prompt: suggestion.video_prompt,
      },
      { includeCharacterAssets, includeLocationAsset },
    )
  }, [includeCharacterAssets, includeLocationAsset, onVariant])

  const handleCustomVariant = useCallback(async () => {
    if (!customInput.trim()) return

    await onVariant(
      {
        title: messages.customVariantTitle,
        description: customInput,
        shot_type: messages.defaultShotType,
        camera_move: messages.defaultCameraMove,
        video_prompt: customInput,
      },
      { includeCharacterAssets, includeLocationAsset },
    )
  }, [
    customInput,
    includeCharacterAssets,
    includeLocationAsset,
    messages.customVariantTitle,
    messages.defaultCameraMove,
    messages.defaultShotType,
    onVariant,
  ])

  const handleClose = useCallback(() => {
    if (isSubmittingVariantTask || isAnalyzing) return
    setSuggestions([])
    setError(null)
    setCustomInput('')
    setSelectedVariantId(null)
    autoAnalyzeKeyRef.current = null
    analyzingRef.current = false
    onClose()
  }, [isAnalyzing, isSubmittingVariantTask, onClose])

  const variantTaskRunningState = useMemo(() => (
    isSubmittingVariantTask
      ? resolveTaskPresentationState({
        phase: 'processing',
        intent: 'generate',
        resource: 'image',
        hasOutput: !!panel.imageUrl,
      })
      : null
  ), [isSubmittingVariantTask, panel.imageUrl])

  const analyzeTaskRunningState = useMemo(() => (
    isAnalyzing
      ? resolveTaskPresentationState({
        phase: 'processing',
        intent: 'analyze',
        resource: 'image',
        hasOutput: false,
      })
      : null
  ), [isAnalyzing])

  return {
    mounted,
    isAnalyzing,
    suggestions,
    error,
    customInput,
    includeCharacterAssets,
    includeLocationAsset,
    selectedVariantId,
    variantTaskRunningState,
    analyzeTaskRunningState,
    setCustomInput,
    setIncludeCharacterAssets,
    setIncludeLocationAsset,
    analyzeShotVariants,
    handleSelectVariant,
    handleCustomVariant,
    handleClose,
  }
}
