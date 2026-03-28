'use client'

/**
 * 场景卡片组件 - 支持多图片选择
 * 布局：上面名字+描述，下面三张图片
 */

import { useState, useRef } from 'react'
import { Location } from '@/types/project'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import ImageGenerationInlineCountButton from '@/components/image-generation/ImageGenerationInlineCountButton'
import { getImageGenerationCountOptions } from '@/lib/image-generation/count'
import { useImageGenerationCount } from '@/lib/image-generation/use-image-generation-count'
import { AppIcon } from '@/components/ui/icons'
import { useLocationCardState } from './location-card/useLocationCardState'
import { LocationCardSelectionView } from './location-card/LocationCardSelectionView'
import { LocationCardCompactView } from './location-card/LocationCardCompactView'
import type {
  LocationCardActionsLabels,
  LocationCardHeaderLabels,
  LocationCardOverlayLabels,
  LocationCardSelectionLabels,
  LocationCardStateMessages,
  LocationImageListLabels,
} from './location-card/types'

interface LocationCardProps {
  location: Location
  onEdit: () => void
  onDelete: () => void
  onRegenerate: (count?: number) => void
  onGenerate: (count?: number) => void
  onUndo?: () => void  // 撤回到上一版本
  onImageClick: (imageUrl: string) => void
  onSelectImage?: (locationId: string, imageIndex: number | null) => void
  onImageEdit?: (locationId: string, imageIndex: number) => void  // 新增：图片编辑
  onCopyFromGlobal?: () => void
  activeTaskKeys?: Set<string>
  onClearTaskKey?: (key: string) => void
  projectId: string
  onConfirmSelection?: (locationId: string) => void
  stateMessages: LocationCardStateMessages
  headerLabels: LocationCardHeaderLabels
  imageListLabels: LocationImageListLabels
  actionLabels: LocationCardActionsLabels
  selectionLabels: LocationCardSelectionLabels
  overlayLabels: LocationCardOverlayLabels
}

export default function LocationCard({
  location,
  onEdit,
  onDelete,
  onRegenerate,
  onGenerate,
  onUndo,
  onImageClick,
  onSelectImage,
  onImageEdit,
  onCopyFromGlobal,
  activeTaskKeys = new Set(),
  projectId,
  onConfirmSelection,
  stateMessages,
  headerLabels,
  imageListLabels,
  actionLabels,
  selectionLabels,
  overlayLabels,
}: LocationCardProps) {
  const { count: generationCount, setCount: setGenerationCount } = useImageGenerationCount('location')
  const {
    uploadImage,
    fileInputRef,
    isConfirmingSelection,
    setIsConfirmingSelection,
    triggerUpload,
    handleUpload,
    generatedImageCount,
    selectedIndex,
    currentImageUrl,
    currentImageIndex,
    isImageTaskRunning,
    isGroupTaskRunning,
    isAnyTaskRunning,
    displayTaskPresentation,
    confirmingSelectionState,
    uploadPendingState,
    isTaskRunning,
    displaySelectionImages,
    displaySlotCount,
    hasMultipleImages,
    hasPreviousVersion,
    showSelectionMode,
    firstImage,
  } = useLocationCardState({
    projectId,
    location,
    activeTaskKeys,
    generationCount,
    messages: stateMessages,
  })

  // 选择模式：显示名字在上，三张图片在下
  if (showSelectionMode) {
    const selectionStatusText = isTaskRunning || generatedImageCount < displaySlotCount
      ? selectionLabels.generatedProgressLabel(generatedImageCount, displaySlotCount)
      : selectedIndex !== null
        ? headerLabels.optionSelectedLabel(selectedIndex + 1)
        : headerLabels.selectFirstLabel

    const selectionHeaderActions = (
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
          options={getImageGenerationCountOptions('location')}
          onValueChange={setGenerationCount}
          onClick={() => onRegenerate(generationCount)}
          disabled={isTaskRunning || isAnyTaskRunning || uploadImage.isPending}
          ariaLabel={selectionLabels.regenCountAriaLabel}
          className="inline-flex h-6 items-center gap-0.5 rounded px-1 hover:bg-[var(--glass-tone-info-bg)] transition-colors disabled:opacity-50"
          selectClassName="appearance-none bg-transparent border-0 pl-0 pr-3 text-[10px] font-semibold text-[var(--glass-tone-info-fg)] outline-none cursor-pointer leading-none transition-colors"
        />
        {onUndo && hasPreviousVersion && (
          <button
            onClick={onUndo}
            disabled={isTaskRunning || isAnyTaskRunning}
            className="w-6 h-6 rounded hover:bg-[var(--glass-tone-warning-bg)] flex items-center justify-center transition-colors disabled:opacity-50"
            title={selectionLabels.undoTitle}
          >
            <AppIcon name="undo" className="w-4 h-4 text-[var(--glass-tone-warning-fg)]" />
          </button>
        )}
        <button
          onClick={onDelete}
          className="w-6 h-6 rounded hover:bg-[var(--glass-tone-danger-bg)] flex items-center justify-center transition-colors"
          title={selectionLabels.deleteTitle}
        >
          <AppIcon name="trash" className="w-4 h-4 text-[var(--glass-tone-danger-fg)]" />
        </button>
      </>
    )

    return (
      <LocationCardSelectionView
        fileInputRef={fileInputRef}
        onFileChange={handleUpload}
        location={location}
        displaySelectionImages={displaySelectionImages}
        selectedIndex={selectedIndex}
        isGroupTaskRunning={isGroupTaskRunning}
        isImageTaskRunning={isImageTaskRunning}
        displayTaskPresentation={displayTaskPresentation}
        onImageClick={onImageClick}
        onSelectImage={onSelectImage}
        selectionStatusText={selectionStatusText}
        selectionHeaderActions={selectionHeaderActions}
        isConfirmingSelection={isConfirmingSelection}
        confirmingSelectionState={confirmingSelectionState}
        onConfirmSelection={selectedIndex !== null && onConfirmSelection
          ? () => {
            setIsConfirmingSelection(true)
            onConfirmSelection(location.id)
          }
          : undefined}
        headerLabels={headerLabels}
        imageListLabels={imageListLabels}
        actionLabels={actionLabels}
      />
    )
  }

  // 单图模式
  const singleOverlayActions = (
    <>
      <button
        onClick={() => triggerUpload(selectedIndex !== null ? selectedIndex : 0)}
        disabled={uploadImage.isPending || isTaskRunning || isAnyTaskRunning}
        className="w-7 h-7 rounded-full bg-[var(--glass-bg-surface-strong)] hover:bg-[var(--glass-tone-success-fg)] hover:text-white flex items-center justify-center transition-all shadow-sm disabled:opacity-50"
        title={currentImageUrl ? overlayLabels.uploadReplaceTitle : overlayLabels.uploadTitle}
      >
        {uploadImage.isPending ? (
          <TaskStatusInline state={uploadPendingState} className="[&_span]:sr-only [&_svg]:text-current" />
        ) : (
          <AppIcon name="upload" className="w-4 h-4 text-[var(--glass-tone-success-fg)]" />
        )}
      </button>
      {!isTaskRunning && currentImageUrl && onImageEdit && (
        <button
          onClick={() => onImageEdit(location.id, currentImageIndex)}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          title={overlayLabels.editTitle}
        >
          <AppIcon name="edit" className="w-4 h-4 text-white" />
        </button>
      )}
      <button
        onClick={() => onRegenerate()}
        disabled={uploadImage.isPending || isTaskRunning}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-90 ${isTaskRunning
          ? 'bg-[var(--glass-tone-success-fg)] hover:bg-[var(--glass-tone-success-fg)]'
          : 'bg-[var(--glass-bg-surface-strong)] hover:bg-[var(--glass-bg-surface)]'
          }`}
        title={isTaskRunning ? overlayLabels.regenerateRunningTitle : overlayLabels.regenerateTitle}
      >
        {isGroupTaskRunning ? (
          <TaskStatusInline state={displayTaskPresentation} className="[&_span]:sr-only [&_svg]:text-white" />
        ) : (
          <AppIcon name="refresh" className={`w-4 h-4 ${isTaskRunning ? 'text-white' : 'text-[var(--glass-text-secondary)]'}`} />
        )}
      </button>
      {!isTaskRunning && currentImageUrl && onUndo && hasPreviousVersion && (
        <button
          onClick={onUndo}
          disabled={isTaskRunning || isAnyTaskRunning}
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
        {onCopyFromGlobal && (
        <button
          onClick={onCopyFromGlobal}
          className="flex-shrink-0 w-5 h-5 rounded hover:bg-[var(--glass-tone-info-bg)] flex items-center justify-center transition-colors"
          title={overlayLabels.copyFromGlobalTitle}
        >
          <AppIcon name="copy" className="w-3.5 h-3.5 text-[var(--glass-tone-info-fg)]" />
        </button>
      )}
      <button
        onClick={onEdit}
        className="flex-shrink-0 w-5 h-5 rounded hover:bg-[var(--glass-bg-muted)] flex items-center justify-center transition-colors"
        title={overlayLabels.editLocationTitle}
      >
        <AppIcon name="edit" className="w-3.5 h-3.5 text-[var(--glass-text-secondary)]" />
      </button>
      <button
        onClick={onDelete}
        className="flex-shrink-0 w-5 h-5 rounded hover:bg-[var(--glass-tone-danger-bg)] flex items-center justify-center transition-colors"
        title={overlayLabels.deleteLocationTitle}
      >
        <AppIcon name="trash" className="w-3.5 h-3.5 text-[var(--glass-tone-danger-fg)]" />
      </button>
    </>
  )

  const hasDescription = !!firstImage?.description

  return (
    <LocationCardCompactView
      fileInputRef={fileInputRef}
      onFileChange={handleUpload}
      locationName={location.name}
      summary={location.summary}
      currentImageUrl={currentImageUrl}
      selectedIndex={selectedIndex}
      hasMultipleImages={hasMultipleImages}
      isTaskRunning={isTaskRunning}
      displayTaskPresentation={displayTaskPresentation}
      imageErrorMessage={firstImage?.lastError?.message || firstImage?.imageErrorMessage}
      onImageClick={onImageClick}
      singleOverlayActions={singleOverlayActions}
      compactHeaderActions={compactHeaderActions}
      hasDescription={hasDescription}
      generationCount={generationCount}
      onGenerationCountChange={setGenerationCount}
      onGenerate={onGenerate}
      imageListLabels={imageListLabels}
      actionLabels={actionLabels}
    />
  )
}
