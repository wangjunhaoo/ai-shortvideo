'use client'
import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'

import { useCallback, useState } from 'react'
import { useInsertProjectPanel } from '@renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionOperations'
import { waitForTaskResult } from '@/lib/task/client'
import { getErrorMessage, isAbortError, type InsertPanelMutationResult } from './panel-operations-shared'

interface UsePanelInsertActionsProps {
  projectId: string
  onRefresh: () => Promise<void> | void
  messages: PanelInsertActionMessages
}

export interface PanelInsertActionMessages {
  unknownError: string
  insertPanelFailed: (error: string) => string
}

export function usePanelInsertActions({
  projectId,
  onRefresh,
  messages,
}: UsePanelInsertActionsProps) {
  const [insertingAfterPanelId, setInsertingAfterPanelId] = useState<string | null>(null)
  const insertPanelMutation = useInsertProjectPanel(projectId)

  const insertPanel = useCallback(async (storyboardId: string, panelId: string, userInput: string) => {
    if (insertingAfterPanelId) return
    setInsertingAfterPanelId(panelId)

    try {
      const data = await insertPanelMutation.mutateAsync({
        storyboardId,
        insertAfterPanelId: panelId,
        userInput,
      })
      const result = (data || {}) as InsertPanelMutationResult
      if (result.async && result.taskId) {
        const taskId = result.taskId
        _ulogInfo(`[Insert Panel] 占位分镜已创建: #${result.panelNumber}，后台生成内容...`)
        setInsertingAfterPanelId(null)
        await onRefresh()

        ; (async () => {
          try {
            await waitForTaskResult(taskId, {
              intervalMs: 3000,
              timeoutMs: 120000,
            })
            _ulogInfo('[Insert Panel] AI内容+图片生成完成，刷新数据')
          } catch (error: unknown) {
            _ulogError(`[Insert Panel] 任务终止: ${getErrorMessage(error, messages.unknownError)}`)
          } finally {
            await onRefresh()
          }
        })()
        return
      }

      await onRefresh()
      setInsertingAfterPanelId(null)
    } catch (error: unknown) {
      if (isAbortError(error)) {
        _ulogInfo('请求被中断（可能是页面刷新）')
        return
      }
      _ulogError('插入分镜失败:', error)
      alert(messages.insertPanelFailed(getErrorMessage(error, messages.unknownError)))
      setInsertingAfterPanelId(null)
    }
  }, [insertPanelMutation, insertingAfterPanelId, messages, onRefresh])

  return {
    insertingAfterPanelId,
    insertPanel,
  }
}
