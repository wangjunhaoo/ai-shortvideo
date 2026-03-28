'use client'

/**
 * 角色卡片组件 - 支持多图片选择和音色设置
 * 布局：上面名字+描述，下面三张图片（每张图片有独立的编辑和重新生成按钮）
 */

import { Character, CharacterAppearance } from '@/types/project'
import VoiceSettings from './VoiceSettings'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import ImageGenerationInlineCountButton from '@/components/image-generation/ImageGenerationInlineCountButton'
import { getImageGenerationCountOptions } from '@/lib/image-generation/count'
import { useImageGenerationCount } from '@/lib/image-generation/use-image-generation-count'
import { AppIcon } from '@/components/ui/icons'
import { AI_EDIT_BUTTON_CLASS, AI_EDIT_ICON_CLASS } from '@/components/ui/ai-edit-style'
import AISparklesIcon from '@/components/ui/icons/AISparklesIcon'
import { useCharacterCardState } from './character-card/useCharacterCardState'
import { CharacterCardSelectionView } from './character-card/CharacterCardSelectionView'
import { CharacterCardCompactView } from './character-card/CharacterCardCompactView'
import type {
  CharacterCardActionsLabels,
  CharacterCardCompactLabels,
  CharacterCardGalleryLabels,
  CharacterCardHeaderLabels,
  CharacterCardOverlayLabels,
  CharacterCardSelectionLabels,
  CharacterCardStateMessages,
} from './character-card/types'
import type { VoiceSettingsLabels } from './VoiceSettings'

interface CharacterCardProps {
  character: Character
  appearance: CharacterAppearance
  onEdit: () => void
  onDelete: () => void
  onDeleteAppearance?: () => void  // 删除单个形象
  onRegenerate: (count?: number) => void
  onGenerate: (count?: number) => void
  onUndo?: () => void  // 撤回到上一版本
  onImageClick: (imageUrl: string) => void
  showDeleteButton: boolean
  appearanceCount?: number  // 该角色的形象数量
  onSelectImage?: (characterId: string, appearanceId: string, imageIndex: number | null) => void
  activeTaskKeys?: Set<string>
  onClearTaskKey?: (key: string) => void
  onImageEdit?: (characterId: string, appearanceId: string, imageIndex: number) => void
  isPrimaryAppearance?: boolean
  primaryAppearanceSelected?: boolean
  projectId: string
  onConfirmSelection?: (characterId: string, appearanceId: string) => void  // 确认选择
  // 音色相关
  onVoiceChange?: (characterId: string, customVoiceUrl?: string) => void
  onVoiceDesign?: (characterId: string, characterName: string) => void  // AI 声音设计
  onVoiceSelectFromHub?: (characterId: string) => void  // 从资产中心选择音色
  stateMessages: CharacterCardStateMessages
  headerLabels: CharacterCardHeaderLabels
  galleryLabels: CharacterCardGalleryLabels
  actionLabels: CharacterCardActionsLabels
  selectionLabels: CharacterCardSelectionLabels
  overlayLabels: CharacterCardOverlayLabels
  compactLabels: CharacterCardCompactLabels
  voiceSettingsLabels: VoiceSettingsLabels
}

export default function CharacterCard({
  character,
  appearance,
  onEdit,
  onDelete,
  onDeleteAppearance,
  onRegenerate,
  onGenerate,
  onUndo,
  onImageClick,
  showDeleteButton,
  appearanceCount = 1,
  onSelectImage,
  activeTaskKeys = new Set(),
  onImageEdit,
  isPrimaryAppearance = false,
  primaryAppearanceSelected = false,
  projectId,
  onConfirmSelection,
  onVoiceChange,
  onVoiceDesign,
  onVoiceSelectFromHub,
  stateMessages,
  headerLabels,
  galleryLabels,
  actionLabels,
  selectionLabels,
  overlayLabels,
  compactLabels,
  voiceSettingsLabels,
}: CharacterCardProps) {
  const { count: generationCount, setCount: setGenerationCount } = useImageGenerationCount('character')
  const {
    uploadImage,
    fileInputRef,
    showDeleteMenu,
    setShowDeleteMenu,
    isConfirmingSelection,
    setIsConfirmingSelection,
    handleDeleteClick,
    triggerUpload,
    handleUpload,
    imageUrlsWithIndex,
    hasMultipleImages,
    selectedIndex,
    currentImageUrl,
    showSelectionMode,
    isImageTaskRunning,
    isGroupTaskRunning,
    isAnyTaskRunning,
    displayTaskPresentation,
    confirmSelectionState,
    uploadPendingState,
    isAppearanceTaskRunning,
  } = useCharacterCardState({
    projectId,
    character,
    appearance,
    activeTaskKeys,
    appearanceCount,
    onDelete,
    messages: stateMessages,
  })

  // 注意：不再使用 editingItems，生成/编辑状态统一由任务态 + 实体态提供

  // 选择模式：显示名字+描述在上，三张图片在下
  if (showSelectionMode) {
    const selectionActions = (
      <>
        <ImageGenerationInlineCountButton
          prefix={isGroupTaskRunning ? (
              <TaskStatusInline state={displayTaskPresentation} className="[&_span]:sr-only [&_svg]:text-[var(--glass-tone-info-fg)]" />
            ) : (
            <>
              <AppIcon name="refresh" className="w-4 h-4 text-[var(--glass-tone-info-fg)]" />
              <span className="text-[10px] font-medium text-[var(--glass-tone-info-fg)] ml-0.5">{selectionLabels.regenCountPrefix}</span>
            </>
          )}
          suffix={<span className="text-[10px] font-medium text-[var(--glass-tone-info-fg)]">{selectionLabels.regenCountSuffix}</span>}
          value={generationCount}
          options={getImageGenerationCountOptions('character')}
          onValueChange={setGenerationCount}
          onClick={() => onRegenerate(generationCount)}
          disabled={isAppearanceTaskRunning || isAnyTaskRunning || uploadImage.isPending}
          ariaLabel={selectionLabels.regenCountAriaLabel}
          className="inline-flex h-6 items-center gap-0.5 rounded px-1 hover:bg-[var(--glass-tone-info-bg)] transition-colors disabled:opacity-50"
          selectClassName="appearance-none bg-transparent border-0 pl-0 pr-3 text-[10px] font-semibold text-[var(--glass-tone-info-fg)] outline-none cursor-pointer leading-none transition-colors"
        />
        {onUndo && (appearance.previousImageUrl || appearance.previousImageUrls.length > 0) && (
          <button
            onClick={onUndo}
            disabled={isAppearanceTaskRunning || isAnyTaskRunning}
            className="w-6 h-6 rounded hover:bg-[var(--glass-tone-warning-bg)] flex items-center justify-center transition-colors disabled:opacity-50"
            title={selectionLabels.undoTitle}
          >
            <AppIcon name="undo" className="w-4 h-4 text-[var(--glass-tone-warning-fg)]" />
          </button>
        )}
        {showDeleteButton && (
          <button
            onClick={onDelete}
            className="w-6 h-6 rounded hover:bg-[var(--glass-tone-danger-bg)] flex items-center justify-center transition-colors"
            title={selectionLabels.deleteTitle}
          >
            <AppIcon name="trash" className="w-4 h-4 text-[var(--glass-tone-danger-fg)]" />
          </button>
        )}
      </>
    )

    const selectionVoiceSettings = (
      <VoiceSettings
        characterId={character.id}
        characterName={character.name}
        customVoiceUrl={character.customVoiceUrl}
        projectId={projectId}
        onVoiceChange={onVoiceChange}
      onVoiceDesign={onVoiceDesign}
      onSelectFromHub={onVoiceSelectFromHub}
      labels={voiceSettingsLabels}
    />
  )

    return (
      <CharacterCardSelectionView
        fileInputRef={fileInputRef}
        onFileChange={handleUpload}
        characterId={character.id}
        appearanceId={appearance.id}
        characterName={character.name}
        changeReason={appearance.changeReason || ''}
        isPrimaryAppearance={isPrimaryAppearance}
        selectedIndex={selectedIndex}
        imageUrlsWithIndex={imageUrlsWithIndex}
        isGroupTaskRunning={isGroupTaskRunning}
        isImageTaskRunning={isImageTaskRunning}
        displayTaskPresentation={displayTaskPresentation}
        onImageClick={onImageClick}
        onSelectImage={onSelectImage}
        selectionActions={selectionActions}
        isConfirmingSelection={isConfirmingSelection}
        confirmSelectionState={confirmSelectionState}
        onConfirmSelection={() => {
          setIsConfirmingSelection(true)
          onConfirmSelection?.(character.id, appearance.id)
        }}
        voiceSettings={selectionVoiceSettings}
        headerLabels={headerLabels}
        galleryLabels={galleryLabels}
        actionLabels={actionLabels}
      />
    )
  }

  // 单图模式或已选择模式
  const overlayActions = (
    <>
      {!isAppearanceTaskRunning && !isAnyTaskRunning && (
        <button
        onClick={() => triggerUpload(selectedIndex !== null ? selectedIndex : 0)}
        disabled={uploadImage.isPending || isAppearanceTaskRunning || isAnyTaskRunning}
        className="w-7 h-7 rounded-full bg-[var(--glass-bg-surface-strong)] hover:bg-[var(--glass-tone-success-fg)] hover:text-white flex items-center justify-center transition-all shadow-sm disabled:opacity-50"
        title={currentImageUrl ? overlayLabels.uploadReplaceTitle : overlayLabels.uploadTitle}
      >
          {uploadImage.isPending ? (
            <TaskStatusInline state={uploadPendingState} className="[&_span]:sr-only [&_svg]:text-current" />
          ) : (
            <AppIcon name="upload" className="w-4 h-4 text-[var(--glass-tone-success-fg)]" />
          )}
        </button>
      )}
      {!isAppearanceTaskRunning && !isAnyTaskRunning && currentImageUrl && onImageEdit && (
        <button
          onClick={() => onImageEdit(character.id, appearance.id, selectedIndex !== null ? selectedIndex : 0)}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-95 ${AI_EDIT_BUTTON_CLASS}`}
          title={overlayLabels.editTitle}
        >
          <AISparklesIcon className={`w-4 h-4 ${AI_EDIT_ICON_CLASS}`} />
        </button>
      )}
      <button
        onClick={() => onRegenerate()}
        disabled={uploadImage.isPending || isAppearanceTaskRunning}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-90 ${(isAppearanceTaskRunning || isAnyTaskRunning)
          ? 'bg-[var(--glass-tone-success-fg)] hover:bg-[var(--glass-tone-success-fg)]'
          : 'bg-[var(--glass-bg-surface-strong)] hover:bg-[var(--glass-bg-surface)]'
          }`}
        title={(isAppearanceTaskRunning || isAnyTaskRunning) ? overlayLabels.regenerateRunningTitle : overlayLabels.regenerateTitle}
      >
        {isGroupTaskRunning ? (
          <TaskStatusInline state={displayTaskPresentation} className="[&_span]:sr-only [&_svg]:text-white" />
        ) : (
          <AppIcon name="refresh" className={`w-4 h-4 ${(isAppearanceTaskRunning || isAnyTaskRunning) ? 'text-white' : 'text-[var(--glass-text-secondary)]'}`} />
        )}
      </button>
      {!isAppearanceTaskRunning && !isAnyTaskRunning && currentImageUrl && onUndo && (appearance.previousImageUrl || appearance.previousImageUrls.length > 0) && (
        <button
          onClick={onUndo}
          disabled={isAppearanceTaskRunning || isAnyTaskRunning}
          className="w-7 h-7 rounded-full bg-[var(--glass-bg-surface-strong)] hover:bg-[var(--glass-tone-warning-fg)] hover:text-white flex items-center justify-center transition-all shadow-sm disabled:opacity-50"
          title={overlayLabels.undoTitle}
        >
          <AppIcon name="undo" className="w-4 h-4 text-[var(--glass-tone-warning-fg)] hover:text-white" />
        </button>
      )}
    </>
  )

  const compactHeaderActions = (
    <>
      <button
        onClick={onEdit}
        className="flex-shrink-0 w-5 h-5 rounded hover:bg-[var(--glass-bg-muted)] flex items-center justify-center transition-colors"
        title={compactLabels.editPromptTitle}
      >
        <AppIcon name="edit" className="w-3.5 h-3.5 text-[var(--glass-text-secondary)]" />
      </button>
      {showDeleteButton && (
        <div className="relative">
          <button
            onClick={handleDeleteClick}
            className="flex-shrink-0 w-5 h-5 rounded hover:bg-[var(--glass-tone-danger-bg)] flex items-center justify-center transition-colors"
            title={appearanceCount <= 1 ? compactLabels.deleteTitle : compactLabels.deleteOptionsTitle}
          >
            <AppIcon name="trash" className="w-3.5 h-3.5 text-[var(--glass-tone-danger-fg)]" />
          </button>

          {showDeleteMenu && appearanceCount > 1 && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDeleteMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--glass-bg-surface)] border border-[var(--glass-stroke-base)] rounded-lg shadow-lg py-1 min-w-[100px]">
                <button
                  onClick={() => {
                    setShowDeleteMenu(false)
                    onDeleteAppearance?.()
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-muted)] whitespace-nowrap"
                >
                  {compactLabels.deleteThisLabel}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteMenu(false)
                    onDelete()
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-[var(--glass-tone-danger-fg)] hover:bg-[var(--glass-tone-danger-bg)] whitespace-nowrap"
                >
                  {compactLabels.deleteWholeLabel}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )

  const compactVoiceSettings = (
    <VoiceSettings
      characterId={character.id}
      characterName={character.name}
      customVoiceUrl={character.customVoiceUrl}
      projectId={projectId}
      onVoiceChange={onVoiceChange}
      onVoiceDesign={onVoiceDesign}
      onSelectFromHub={onVoiceSelectFromHub}
      compact={true}
      labels={voiceSettingsLabels}
    />
  )

  return (
    <CharacterCardCompactView
      fileInputRef={fileInputRef}
      onFileChange={handleUpload}
      characterName={character.name}
      changeReason={appearance.changeReason || ''}
      currentImageUrl={currentImageUrl}
      selectedIndex={selectedIndex}
      hasMultipleImages={hasMultipleImages}
      isAppearanceTaskRunning={isAppearanceTaskRunning}
      isGroupTaskRunning={isGroupTaskRunning}
      displayTaskPresentation={displayTaskPresentation}
      appearanceErrorMessage={appearance.lastError?.message || appearance.imageErrorMessage}
      onImageClick={onImageClick}
      overlayActions={overlayActions}
      compactHeaderActions={compactHeaderActions}
      isPrimaryAppearance={isPrimaryAppearance}
      primaryAppearanceSelected={primaryAppearanceSelected}
      isAnyTaskRunning={isAnyTaskRunning}
      hasDescription={!!appearance.description}
      generationCount={generationCount}
      onGenerationCountChange={setGenerationCount}
      onGenerate={onGenerate}
      voiceSettings={compactVoiceSettings}
      galleryLabels={galleryLabels}
      actionLabels={actionLabels}
    />
  )
}
