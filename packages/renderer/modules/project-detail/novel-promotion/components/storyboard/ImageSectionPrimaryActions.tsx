'use client'

import ImageGenerationInlineCountButton from '@/components/image-generation/ImageGenerationInlineCountButton'
import { getImageGenerationCountOptions } from '@/lib/image-generation/count'
import { AI_EDIT_BUTTON_CLASS, AI_EDIT_ICON_CLASS } from '@/components/ui/ai-edit-style'
import AISparklesIcon from '@/components/ui/icons/AISparklesIcon'
import { AppIcon } from '@/components/ui/icons'
import type { ImageSectionActionLabels } from './ImageSectionActionButtons.types'

interface ImageSectionPrimaryActionsProps {
  labels: Pick<
    ImageSectionActionLabels,
    | 'regenerateLabel'
    | 'forceRegenerateLabel'
    | 'generateCountSuffix'
    | 'selectCountAriaLabel'
    | 'viewDataLabel'
    | 'editImageLabel'
  >
  imageUrl: string | null
  isSubmittingPanelImageTask: boolean
  isModifying: boolean
  count: number
  onCountChange: (count: number) => void
  onRegenerate: () => void
  onOpenAIDataModal: () => void
  onOpenEditModal: () => void
}

export default function ImageSectionPrimaryActions({
  labels,
  imageUrl,
  isSubmittingPanelImageTask,
  isModifying,
  count,
  onCountChange,
  onRegenerate,
  onOpenAIDataModal,
  onOpenEditModal,
}: ImageSectionPrimaryActionsProps) {
  return (
    <>
      <ImageGenerationInlineCountButton
        prefix={
          <>
            <AppIcon name="refresh" className="w-2.5 h-2.5" />
            <span>
              {isSubmittingPanelImageTask
                ? labels.forceRegenerateLabel
                : labels.regenerateLabel}
            </span>
          </>
        }
        suffix={<span>{labels.generateCountSuffix}</span>}
        value={count}
        options={getImageGenerationCountOptions('storyboard-candidates')}
        onValueChange={onCountChange}
        onClick={onRegenerate}
        disabled={false}
        ariaLabel={labels.selectCountAriaLabel}
        className={`glass-btn-base glass-btn-secondary flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] transition-all active:scale-95 ${
          isSubmittingPanelImageTask ? 'opacity-75' : ''
        }`}
        selectClassName="appearance-none bg-transparent border-0 pl-0 pr-3 text-[10px] font-semibold text-[var(--glass-text-primary)] outline-none cursor-pointer leading-none transition-colors"
        labelClassName="inline-flex items-center gap-0.5"
      />

      <div className="w-px h-3 bg-[var(--glass-stroke-base)]" />

      <button
        onClick={onOpenAIDataModal}
        className={`glass-btn-base glass-btn-secondary flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] transition-all active:scale-95 ${
          isSubmittingPanelImageTask || isModifying ? 'opacity-75' : ''
        }`}
        title={labels.viewDataLabel}
      >
        <AppIcon name="chart" className="w-2.5 h-2.5" />
        <span>{labels.viewDataLabel}</span>
      </button>

      {imageUrl && (
        <button
          onClick={onOpenEditModal}
          className={`glass-btn-base h-6 w-6 rounded-full flex items-center justify-center transition-all active:scale-95 ${
            AI_EDIT_BUTTON_CLASS
          } ${isSubmittingPanelImageTask || isModifying ? 'opacity-75' : ''}`}
          title={labels.editImageLabel}
        >
          <AISparklesIcon className={`w-2.5 h-2.5 ${AI_EDIT_ICON_CLASS}`} />
        </button>
      )}
    </>
  )
}
