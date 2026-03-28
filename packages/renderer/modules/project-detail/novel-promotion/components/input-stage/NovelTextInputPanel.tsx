import { AppIcon } from '@/components/ui/icons'

interface NovelTextInputPanelProps {
  localText: string
  isSubmittingTask: boolean
  isSwitchingStage: boolean
  onTextChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  onCompositionStart: (event: React.CompositionEvent<HTMLTextAreaElement>) => void
  onCompositionEnd: (event: React.CompositionEvent<HTMLTextAreaElement>) => void
  labels: NovelTextInputPanelLabels
}

export interface NovelTextInputPanelLabels {
  wordCountLabel: (count: number) => string
  assetLibraryTipTitle: string
  assetLibraryTipDescription: string
}

export function NovelTextInputPanel({
  localText,
  isSubmittingTask,
  isSwitchingStage,
  onTextChange,
  onCompositionStart,
  onCompositionEnd,
  labels,
}: NovelTextInputPanelProps) {
  return (
    <div className="glass-surface-elevated overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-end mb-3">
          <span className="glass-chip glass-chip-neutral text-xs">
            {labels.wordCountLabel(localText.length)}
          </span>
        </div>

        <textarea
          value={localText}
          onChange={onTextChange}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          placeholder={`请输入您的剧本或小说内容...

AI 将根据您的文本智能分析：
• 自动识别场景切换
• 提取角色对话和动作
• 生成分镜脚本

例如：
清晨，阳光透过窗帘洒进房间。小明揉着惺忪的睡眼从床上坐起，看了一眼床头的闹钟——已经八点了！他猛地跳下床，手忙脚乱地开始穿衣服...`}
          className="glass-textarea-base custom-scrollbar h-80 px-4 py-3 text-base resize-none placeholder:text-[var(--glass-text-tertiary)]"
          disabled={isSubmittingTask || isSwitchingStage}
        />

        <div className="mt-5 p-4 glass-surface-soft">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 glass-surface-soft rounded-xl flex items-center justify-center flex-shrink-0">
              <AppIcon name="folderCards" className="w-5 h-5 text-[var(--glass-text-secondary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[var(--glass-text-secondary)] mb-1">{labels.assetLibraryTipTitle}</div>
              <p className="text-sm text-[var(--glass-text-tertiary)] leading-relaxed">
                {labels.assetLibraryTipDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
