'use client'

/**
 * 角色档案编辑对话框
 * 允许用户编辑角色档案的各项属性
 */

import { useEffect, useState } from 'react'
import { CharacterProfileData, CostumeTier, RoleLevel } from '@/types/character-profile'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { AppIcon } from '@/components/ui/icons'

export interface CharacterProfileDialogLabels {
    editDialogTitle: (name: string) => string
    importanceLevel: string
    importanceOptionLabel: (level: RoleLevel) => string
    characterArchetype: string
    archetypePlaceholder: string
    personalityTags: string
    addTagPlaceholder: string
    addLabel: string
    costumeLevelLabel: string
    costumeLevelOptionLabel: (tier: CostumeTier) => string
    suggestedColors: string
    colorPlaceholder: string
    primaryMarker: string
    markerNote: string
    markingsPlaceholder: string
    visualKeywords: string
    keywordsPlaceholder: string
    cancel: string
    confirmAndGenerate: string
}

interface CharacterProfileDialogProps {
    isOpen: boolean
    characterName: string
    profileData: CharacterProfileData
    onClose: () => void
    onSave: (profileData: CharacterProfileData) => void
    isSaving?: boolean
    labels: CharacterProfileDialogLabels
}

const ROLE_LEVELS: RoleLevel[] = ['S', 'A', 'B', 'C', 'D']
const COSTUME_TIERS: CostumeTier[] = [5, 4, 3, 2, 1]

export default function CharacterProfileDialog({
    isOpen,
    characterName,
    profileData,
    onClose,
    onSave,
    isSaving = false,
    labels,
}: CharacterProfileDialogProps) {
    const savingState = isSaving
        ? resolveTaskPresentationState({
            phase: 'processing',
            intent: 'build',
            resource: 'image',
            hasOutput: false,
        })
        : null
    const [formData, setFormData] = useState<CharacterProfileData>(profileData)
    const [newTag, setNewTag] = useState('')
    const [newColor, setNewColor] = useState('')
    const [newKeyword, setNewKeyword] = useState('')

    useEffect(() => {
        setFormData(profileData)
    }, [profileData])

    if (!isOpen) return null

    const handleSubmit = () => {
        onSave(formData)
    }

    const addTag = () => {
        if (newTag.trim() && !formData.personality_tags.includes(newTag.trim())) {
            setFormData({ ...formData, personality_tags: [...formData.personality_tags, newTag.trim()] })
            setNewTag('')
        }
    }

    const removeTag = (index: number) => {
        setFormData({
            ...formData,
            personality_tags: formData.personality_tags.filter((_, i) => i !== index)
        })
    }

    const addColor = () => {
        if (newColor.trim() && !formData.suggested_colors.includes(newColor.trim())) {
            setFormData({ ...formData, suggested_colors: [...formData.suggested_colors, newColor.trim()] })
            setNewColor('')
        }
    }

    const removeColor = (index: number) => {
        setFormData({
            ...formData,
            suggested_colors: formData.suggested_colors.filter((_, i) => i !== index)
        })
    }

    const addKeyword = () => {
        if (newKeyword.trim() && !formData.visual_keywords.includes(newKeyword.trim())) {
            setFormData({ ...formData, visual_keywords: [...formData.visual_keywords, newKeyword.trim()] })
            setNewKeyword('')
        }
    }

    const removeKeyword = (index: number) => {
        setFormData({
            ...formData,
            visual_keywords: formData.visual_keywords.filter((_, i) => i !== index)
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--glass-overlay)]" onClick={onClose}>
            <div
                className="bg-[var(--glass-bg-surface)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-[var(--glass-bg-surface)] border-b border-[var(--glass-stroke-base)] px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-[var(--glass-text-primary)]">{labels.editDialogTitle(characterName)}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--glass-bg-muted)] rounded-lg transition-colors"
                    >
                        <AppIcon name="close" className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">{labels.importanceLevel}</label>
                        <select
                            value={formData.role_level}
                            onChange={(e) => setFormData({ ...formData, role_level: e.target.value as RoleLevel })}
                            className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg focus:ring-2 focus:ring-[var(--glass-tone-info-fg)] focus:border-[var(--glass-stroke-focus)]"
                        >
                            {ROLE_LEVELS.map((level) => (
                                <option key={level} value={level}>
                                    {labels.importanceOptionLabel(level)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">{labels.characterArchetype}</label>
                        <input
                            type="text"
                            value={formData.archetype}
                            onChange={(e) => setFormData({ ...formData, archetype: e.target.value })}
                            placeholder={labels.archetypePlaceholder}
                            className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg focus:ring-2 focus:ring-[var(--glass-tone-info-fg)] focus:border-[var(--glass-stroke-focus)]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">{labels.personalityTags}</label>
                        <div className="flex gap-2 mb-2">
                            {formData.personality_tags.map((tag, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] rounded-lg text-sm">
                                    {tag}
                                    <button onClick={() => removeTag(i)} className="inline-flex h-4 w-4 items-center justify-center hover:text-[var(--glass-text-primary)]">
                                        <AppIcon name="closeSm" className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                placeholder={labels.addTagPlaceholder}
                                className="flex-1 px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg"
                            />
                            <button onClick={addTag} className="px-4 py-2 bg-[var(--glass-accent-from)] text-white rounded-lg hover:bg-[var(--glass-accent-to)]">
                                {labels.addLabel}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">{labels.costumeLevelLabel}</label>
                        <select
                            value={formData.costume_tier}
                            onChange={(e) => setFormData({ ...formData, costume_tier: Number(e.target.value) as CostumeTier })}
                            className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg focus:ring-2 focus:ring-[var(--glass-tone-info-fg)] focus:border-[var(--glass-stroke-focus)]"
                        >
                            {COSTUME_TIERS.map((tier) => (
                                <option key={tier} value={tier}>
                                    {labels.costumeLevelOptionLabel(tier)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">{labels.suggestedColors}</label>
                        <div className="flex gap-2 mb-2 flex-wrap">
                            {formData.suggested_colors.map((color, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--glass-bg-muted)] text-[var(--glass-text-secondary)] rounded-lg text-sm">
                                    {color}
                                    <button onClick={() => removeColor(i)} className="inline-flex h-4 w-4 items-center justify-center hover:text-[var(--glass-text-primary)]">
                                        <AppIcon name="closeSm" className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newColor}
                                onChange={(e) => setNewColor(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                                placeholder={labels.colorPlaceholder}
                                className="flex-1 px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg"
                            />
                            <button onClick={addColor} className="px-4 py-2 bg-[var(--glass-accent-from)] text-white rounded-lg hover:bg-[var(--glass-accent-to)]">
                                {labels.addLabel}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">
                            {labels.primaryMarker} <span className="text-xs text-[var(--glass-text-tertiary)]">{labels.markerNote}</span>
                        </label>
                        <input
                            type="text"
                            value={formData.primary_identifier || ''}
                            onChange={(e) => setFormData({ ...formData, primary_identifier: e.target.value })}
                            placeholder={labels.markingsPlaceholder}
                            className="w-full px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg focus:ring-2 focus:ring-[var(--glass-tone-info-fg)] focus:border-[var(--glass-stroke-focus)]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">{labels.visualKeywords}</label>
                        <div className="flex gap-2 mb-2 flex-wrap">
                            {formData.visual_keywords.map((keyword, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] rounded-lg text-sm">
                                    {keyword}
                                    <button onClick={() => removeKeyword(i)} className="inline-flex h-4 w-4 items-center justify-center hover:text-[var(--glass-text-primary)]">
                                        <AppIcon name="closeSm" className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newKeyword}
                                onChange={(e) => setNewKeyword(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                                placeholder={labels.keywordsPlaceholder}
                                className="flex-1 px-3 py-2 border border-[var(--glass-stroke-strong)] rounded-lg"
                            />
                            <button onClick={addKeyword} className="px-4 py-2 bg-[var(--glass-accent-from)] text-white rounded-lg hover:bg-[var(--glass-accent-to)]">
                                {labels.addLabel}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-[var(--glass-bg-surface)] border-t border-[var(--glass-stroke-base)] px-6 py-4 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2 border border-[var(--glass-stroke-strong)] rounded-lg hover:bg-[var(--glass-bg-muted)] transition-colors disabled:opacity-50"
                    >
                        {labels.cancel}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2 bg-[var(--glass-accent-from)] text-white rounded-lg hover:bg-[var(--glass-accent-to)] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving && <TaskStatusInline state={savingState} className="text-white [&>span]:sr-only [&_svg]:text-white" />}
                        {labels.confirmAndGenerate}
                    </button>
                </div>
            </div>
        </div>
    )
}
