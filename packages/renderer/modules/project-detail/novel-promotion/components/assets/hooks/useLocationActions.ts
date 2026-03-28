'use client'
import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'

/**
 * useLocationActions - 场景资产操作 Hook
 * 从 AssetsStage 提取，负责场景的 CRUD 和图片生成操作
 * 
 * 🔥 V6.5 重构：直接订阅 useProjectAssets，消除 props drilling
 */

import { useCallback } from 'react'
import { isAbortError } from '@/lib/error-utils'
import { useProjectAssets, useRefreshProjectAssets } from '@renderer/hooks/useRendererProjectQueries'
import {
    useRegenerateSingleLocationImage,
    useRegenerateLocationGroup,
    useDeleteProjectLocation,
    useSelectProjectLocationImage,
    useConfirmProjectLocationSelection,
    useUpdateProjectLocationDescription,
} from '@renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionOperations'

interface UseLocationActionsProps {
    projectId: string
    showToast?: (message: string, type: 'success' | 'warning' | 'error') => void
    messages: {
        unknownError: string
        deleteConfirm: string
        deleteFailed: (error: string) => string
        selectFailed: (error: string) => string
        confirmSuccess: string
        confirmFailed: (error: string) => string
        regenerateFailed: (error: string) => string
        updateDescriptionFailed: string
    }
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'object' && error !== null) {
        const message = (error as { message?: unknown }).message
        if (typeof message === 'string') return message
    }
    return fallback
}

export function useLocationActions({
    projectId,
    showToast,
    messages,
}: UseLocationActionsProps) {
    // 🔥 直接订阅缓存 - 消除 props drilling
    const { data: assets } = useProjectAssets(projectId)
    const locations = assets?.locations ?? []

    // 🔥 使用刷新函数 - mutations 完成后刷新缓存
    const refreshAssets = useRefreshProjectAssets(projectId)

    // 🔥 V6.7: 使用重新生成mutation hooks
    const regenerateSingleImage = useRegenerateSingleLocationImage(projectId)
    const regenerateGroup = useRegenerateLocationGroup(projectId)
    const deleteLocationMutation = useDeleteProjectLocation(projectId)
    const selectLocationImageMutation = useSelectProjectLocationImage(projectId)
    const confirmLocationSelectionMutation = useConfirmProjectLocationSelection(projectId)
    const updateLocationDescriptionMutation = useUpdateProjectLocationDescription(projectId)

    // 删除场景
    const handleDeleteLocation = useCallback(async (locationId: string) => {
        if (!confirm(messages.deleteConfirm)) return
        try {
            await deleteLocationMutation.mutateAsync(locationId)
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                alert(messages.deleteFailed(getErrorMessage(error, messages.unknownError)))
            }
        }
    }, [deleteLocationMutation, messages])

    // 处理场景图片选择
    const handleSelectLocationImage = useCallback(async (locationId: string, imageIndex: number | null) => {
        try {
            await selectLocationImageMutation.mutateAsync({ locationId, imageIndex })
        } catch (error: unknown) {
            if (isAbortError(error)) {
                _ulogInfo('请求被中断（可能是页面刷新），后端仍在执行')
                return
            }
            alert(messages.selectFailed(getErrorMessage(error, messages.unknownError)))
        }
    }, [messages, selectLocationImageMutation])

    // 确认选择并删除其他候选图片
    const handleConfirmLocationSelection = useCallback(async (locationId: string) => {
        try {
            await confirmLocationSelectionMutation.mutateAsync({ locationId })
            showToast?.(`✓ ${messages.confirmSuccess}`, 'success')
        } catch (error: unknown) {
            if (isAbortError(error)) {
                _ulogInfo('请求被中断（可能是页面刷新），后端仍在执行')
                return
            }
            showToast?.(messages.confirmFailed(getErrorMessage(error, messages.unknownError)), 'error')
        }
    }, [confirmLocationSelectionMutation, messages, showToast])

    // 单张重新生成场景图片 - 🔥 V6.7: 使用mutation hook
    const handleRegenerateSingleLocation = useCallback(async (locationId: string, imageIndex: number) => {
        try {
            await regenerateSingleImage.mutateAsync({ locationId, imageIndex })
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                alert(messages.regenerateFailed(getErrorMessage(error, messages.unknownError)))
            }
            throw error
        }
    }, [messages, regenerateSingleImage])

    // 整组重新生成场景图片 - 🔥 V6.7: 使用mutation hook
    const handleRegenerateLocationGroup = useCallback(async (locationId: string, count?: number) => {
        try {
            await regenerateGroup.mutateAsync({ locationId, count })
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                alert(messages.regenerateFailed(getErrorMessage(error, messages.unknownError)))
            }
            throw error
        }
    }, [messages, regenerateGroup])

    // 更新场景描述 - 🔥 保存到服务器
    const handleUpdateLocationDescription = useCallback(async (
        locationId: string,
        newDescription: string
    ) => {
        try {
            await updateLocationDescriptionMutation.mutateAsync({
                locationId,
                description: newDescription,
            })
            refreshAssets()
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                _ulogError(messages.updateDescriptionFailed, getErrorMessage(error, messages.unknownError))
            }
        }
    }, [messages, refreshAssets, updateLocationDescriptionMutation])

    return {
        // 🔥 暴露 locations 供组件使用
        locations,
        handleDeleteLocation,
        handleSelectLocationImage,
        handleConfirmLocationSelection,
        handleRegenerateSingleLocation,
        handleRegenerateLocationGroup,
        handleUpdateLocationDescription
    }
}
