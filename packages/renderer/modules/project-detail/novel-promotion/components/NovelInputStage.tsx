'use client'

/**
 * 小说推文模式 - 故事输入阶段 (Story View)
 * V3.2 UI: 极简版，专注剧本输入，资产管理移至资产库
 */

import '@/styles/animations.css'
import { CurrentEpisodeBanner } from './input-stage/CurrentEpisodeBanner'
import { NovelInputActionPanel } from './input-stage/NovelInputActionPanel'
import { NovelInputConfigPanel } from './input-stage/NovelInputConfigPanel'
import { NovelTextInputPanel } from './input-stage/NovelTextInputPanel'
import { useNovelInputStageLabels } from './input-stage/useNovelInputStageLabels'
import { useNovelInputTextState } from './input-stage/useNovelInputTextState'

interface NovelInputStageProps {
  // 核心数据
  novelText: string
  // 当前剧集名称
  episodeName?: string
  // 回调函数
  onNovelTextChange: (value: string) => void
  onNext: () => void
  // 状态
  isSubmittingTask?: boolean
  isSwitchingStage?: boolean
  // 旁白开关
  enableNarration?: boolean
  onEnableNarrationChange?: (enabled: boolean) => void
  // 配置项 - 比例与风格
  videoRatio?: string
  artStyle?: string
  onVideoRatioChange?: (value: string) => void
  onArtStyleChange?: (value: string) => void
}

export default function NovelInputStage({
  novelText,
  episodeName,
  onNovelTextChange,
  onNext,
  isSubmittingTask = false,
  isSwitchingStage = false,
  enableNarration = false,
  onEnableNarrationChange,
  videoRatio = '9:16',
  artStyle = 'american-comic',
  onVideoRatioChange,
  onArtStyleChange
}: NovelInputStageProps) {
  const {
    localText,
    hasContent,
    handleTextChange,
    handleCompositionStart,
    handleCompositionEnd,
  } = useNovelInputTextState({
    novelText,
    onNovelTextChange,
  })
  const { bannerLabels, textInputLabels, configLabels, actionLabels } =
    useNovelInputStageLabels()

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <CurrentEpisodeBanner episodeName={episodeName} labels={bannerLabels} />
      <NovelTextInputPanel
        localText={localText}
        isSubmittingTask={isSubmittingTask}
        isSwitchingStage={isSwitchingStage}
        onTextChange={handleTextChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        labels={textInputLabels}
      />
      <NovelInputConfigPanel
        videoRatio={videoRatio}
        artStyle={artStyle}
        onVideoRatioChange={onVideoRatioChange}
        onArtStyleChange={onArtStyleChange}
        labels={configLabels}
      />
      <NovelInputActionPanel
        enableNarration={enableNarration}
        onEnableNarrationChange={onEnableNarrationChange}
        onNext={onNext}
        hasContent={hasContent}
        isSubmittingTask={isSubmittingTask}
        isSwitchingStage={isSwitchingStage}
        labels={actionLabels}
      />
    </div>
  )
}
