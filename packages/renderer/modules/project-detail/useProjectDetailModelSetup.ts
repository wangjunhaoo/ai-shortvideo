import { useCallback, useEffect, useState } from 'react'
import {
  getUserPreference,
  updateUserPreference,
} from '@renderer/clients/project-client'
import { logError as _ulogError } from '@/lib/logging/core'
import { readConfiguredAnalysisModel, shouldGuideToModelSetup } from '@/lib/workspace/model-setup'
import { useUserModels } from '@renderer/hooks/useRendererProjectQueries'
import type { TranslationFn } from './detail-types'

export function useProjectDetailModelSetup(
  enabled: boolean,
  t: TranslationFn,
) {
  const [isCheckingModelSetup, setIsCheckingModelSetup] = useState(true)
  const [needsModelSetup, setNeedsModelSetup] = useState(false)
  const [analysisModelDraft, setAnalysisModelDraft] = useState('')
  const [isModelSetupModalOpen, setIsModelSetupModalOpen] = useState(false)
  const [modelSetupSaving, setModelSetupSaving] = useState(false)

  const userModelsQuery = useUserModels()
  const llmModelOptions = userModelsQuery.data?.llm || []

  useEffect(() => {
    if (!enabled) {
      setIsCheckingModelSetup(false)
      return
    }

    let canceled = false
    const checkDefaultModelSetup = async () => {
      setIsCheckingModelSetup(true)
      try {
        const response = await getUserPreference()
        if (!response.ok) {
          _ulogError('[ProjectDetail] 获取用户默认模型失败:', { status: response.status })
          if (!canceled) {
            setNeedsModelSetup(true)
            setAnalysisModelDraft('')
          }
          return
        }

        const payload: unknown = await response.json()
        const configuredModel = readConfiguredAnalysisModel(payload)
        if (!canceled) {
          setAnalysisModelDraft(configuredModel || '')
          setNeedsModelSetup(shouldGuideToModelSetup(payload))
        }
      } catch (error) {
        _ulogError('[ProjectDetail] 检查默认模型失败:', error)
        if (!canceled) {
          setNeedsModelSetup(true)
          setAnalysisModelDraft('')
        }
      } finally {
        if (!canceled) {
          setIsCheckingModelSetup(false)
        }
      }
    }

    void checkDefaultModelSetup()
    return () => {
      canceled = true
    }
  }, [enabled])

  const handleSaveDefaultAnalysisModel = useCallback(async () => {
    const modelKey = analysisModelDraft.trim()
    if (!modelKey) {
      alert(t('modelSetup.selectModelFirst'))
      return
    }

    setModelSetupSaving(true)
    try {
      const response = await updateUserPreference({ analysisModel: modelKey })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      setNeedsModelSetup(false)
      setIsModelSetupModalOpen(false)
    } catch (error) {
      _ulogError('[ProjectDetail] 保存默认分析模型失败:', error)
      alert(t('modelSetup.saveFailed'))
    } finally {
      setModelSetupSaving(false)
    }
  }, [analysisModelDraft, t])

  return {
    userModelsQuery,
    llmModelOptions,
    isCheckingModelSetup,
    needsModelSetup,
    analysisModelDraft,
    setAnalysisModelDraft,
    isModelSetupModalOpen,
    setIsModelSetupModalOpen,
    modelSetupSaving,
    handleSaveDefaultAnalysisModel,
  }
}
