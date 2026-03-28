'use client'
import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'

/**
 * useCharacterActions - 角色资产操作 Hook
 * 从 AssetsStage 提取，负责角色的 CRUD 和图片生成操作
 * 
 * 🔥 V6.5 重构：直接订阅 useProjectAssets，消除 props drilling
 */

import { useCallback } from 'react'
import { CharacterAppearance } from '@/types/project'
import { isAbortError } from '@/lib/error-utils'
import { useProjectAssets, useRefreshProjectAssets, type Character } from '@renderer/hooks/useRendererProjectQueries'
import {
    useRegenerateSingleCharacterImage,
    useRegenerateCharacterGroup,
    useDeleteProjectCharacter,
    useDeleteProjectAppearance,
    useSelectProjectCharacterImage,
    useConfirmProjectCharacterSelection,
    useUpdateProjectAppearanceDescription,
} from '@renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionOperations'

interface UseCharacterActionsProps {
    projectId: string
    showToast?: (message: string, type: 'success' | 'warning' | 'error') => void
    messages: {
        unknownError: string
        deleteConfirm: string
        deleteAppearanceConfirm: string
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

export function useCharacterActions({
    projectId,
    showToast,
    messages,
}: UseCharacterActionsProps) {
    // 🔥 直接订阅缓存 - 消除 props drilling
    const { data: assets } = useProjectAssets(projectId)
    const characters = assets?.characters ?? []

    // 🔥 使用刷新函数 - mutations 完成后刷新缓存
    const refreshAssets = useRefreshProjectAssets(projectId)

    // 🔥 V6.7: 使用重新生成mutation hooks
    const regenerateSingleImage = useRegenerateSingleCharacterImage(projectId)
    const regenerateGroup = useRegenerateCharacterGroup(projectId)
    const deleteCharacterMutation = useDeleteProjectCharacter(projectId)
    const deleteAppearanceMutation = useDeleteProjectAppearance(projectId)
    const selectCharacterImageMutation = useSelectProjectCharacterImage(projectId)
    const confirmCharacterSelectionMutation = useConfirmProjectCharacterSelection(projectId)
    const updateAppearanceDescriptionMutation = useUpdateProjectAppearanceDescription(projectId)

    // 获取形象列表
    const getAppearances = useCallback((character: Character): CharacterAppearance[] => {
        return character.appearances || []
    }, [])

    // 删除角色
    const handleDeleteCharacter = useCallback(async (characterId: string) => {
        if (!confirm(messages.deleteConfirm)) return
        try {
            await deleteCharacterMutation.mutateAsync(characterId)
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                alert(messages.deleteFailed(getErrorMessage(error, messages.unknownError)))
            }
        }
    }, [deleteCharacterMutation, messages])

    // 删除单个形象
    const handleDeleteAppearance = useCallback(async (characterId: string, appearanceId: string) => {
        if (!confirm(messages.deleteAppearanceConfirm)) return
        try {
            await deleteAppearanceMutation.mutateAsync({ characterId, appearanceId })
            // 🔥 刷新缓存
            refreshAssets()
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                alert(messages.deleteFailed(getErrorMessage(error, messages.unknownError)))
            }
        }
    }, [deleteAppearanceMutation, messages, refreshAssets])

    // 处理角色图片选择
    const handleSelectCharacterImage = useCallback(async (
        characterId: string,
        appearanceId: string,
        imageIndex: number | null
    ) => {
        try {
            await selectCharacterImageMutation.mutateAsync({
                characterId,
                appearanceId,
                imageIndex,
            })
        } catch (error: unknown) {
            if (isAbortError(error)) {
                _ulogInfo('请求被中断（可能是页面刷新），后端仍在执行')
                return
            }
            alert(messages.selectFailed(getErrorMessage(error, messages.unknownError)))
        }
    }, [messages, selectCharacterImageMutation])

    // 确认选择并删除其他候选图片
    const handleConfirmSelection = useCallback(async (characterId: string, appearanceId: string) => {
        try {
            await confirmCharacterSelectionMutation.mutateAsync({ characterId, appearanceId })
            showToast?.(`✓ ${messages.confirmSuccess}`, 'success')
        } catch (error: unknown) {
            if (isAbortError(error)) {
                _ulogInfo('请求被中断（可能是页面刷新），后端仍在执行')
                return
            }
            showToast?.(messages.confirmFailed(getErrorMessage(error, messages.unknownError)), 'error')
        }
    }, [confirmCharacterSelectionMutation, messages, showToast])

    // 单张重新生成角色图片 - 🔥 V6.7: 使用mutation hook
    const handleRegenerateSingleCharacter = useCallback(async (
        characterId: string,
        appearanceId: string,
        imageIndex: number
    ) => {
        try {
            await regenerateSingleImage.mutateAsync({ characterId, appearanceId, imageIndex })
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                alert(messages.regenerateFailed(getErrorMessage(error, messages.unknownError)))
            }
            throw error
        }
    }, [messages, regenerateSingleImage])

    // 整组重新生成角色图片 - 🔥 V6.7: 使用mutation hook
    const handleRegenerateCharacterGroup = useCallback(async (
        characterId: string,
        appearanceId: string,
        count?: number,
    ) => {
        try {
            await regenerateGroup.mutateAsync({ characterId, appearanceId, count })
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                alert(messages.regenerateFailed(getErrorMessage(error, messages.unknownError)))
            }
            throw error
        }
    }, [messages, regenerateGroup])

    // 更新形象描述 - 🔥 仍需保存到服务器
    const handleUpdateAppearanceDescription = useCallback(async (
        characterId: string,
        appearanceId: string,
        newDescription: string,
        descriptionIndex?: number
    ) => {
        try {
            await updateAppearanceDescriptionMutation.mutateAsync({
                characterId,
                appearanceId,
                description: newDescription,
                descriptionIndex,
            })
            refreshAssets()
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                _ulogError(messages.updateDescriptionFailed, getErrorMessage(error, messages.unknownError))
            }
        }
    }, [messages, refreshAssets, updateAppearanceDescriptionMutation])

    return {
        // 🔥 暴露 characters 供组件使用（可选，组件也可以自己订阅）
        characters,
        getAppearances,
        handleDeleteCharacter,
        handleDeleteAppearance,
        handleSelectCharacterImage,
        handleConfirmSelection,
        handleRegenerateSingleCharacter,
        handleRegenerateCharacterGroup,
        handleUpdateAppearanceDescription
    }
}
