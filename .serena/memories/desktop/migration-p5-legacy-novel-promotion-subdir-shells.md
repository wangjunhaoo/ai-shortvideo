2026-03-28：继续压缩旧 src/app/[locale]/workspace/[projectId]/modes/novel-promotion compat 树，把四组高频子目录收成 renderer 壳。

1. video-stage：旧目录下 VideoRenderPanel.tsx、VideoStageLayout.tsx、VideoStageShell.tsx、VideoTimelinePanel.tsx、hooks/useVideoStageRuntime.tsx 已统一改成对 packages/renderer/modules/project-detail/novel-promotion/components/video-stage/* 的 re-export shell。
2. voice-stage：旧目录下 VoiceControlPanel.tsx、VoiceLineList.tsx、VoiceStageLayout.tsx、VoiceStageShell.tsx、hooks/useVoiceStageRuntime.tsx 已统一改成对 packages/renderer/modules/project-detail/novel-promotion/components/voice-stage/* 的 re-export shell。
3. prompts-stage：旧目录下 PromptEditorPanel.tsx、PromptListPanel.tsx、PromptListCardView.tsx、PromptsStageLayout.tsx、PromptListTableView.tsx、PromptsStageShell.tsx、hooks/usePromptStageActions.tsx、runtime/promptStageRuntimeCore.tsx、runtime/promptStageRuntime.types.ts、runtime/promptStageRuntime.utils.ts、runtime/hooks/usePromptEditorRuntime.ts、usePromptDraftByShot.ts、usePromptAssetMention.ts、usePromptAppendFlow.ts、usePromptAiModifyFlow.ts 已统一改成 renderer shell。
4. script-view：旧目录下 SpotlightCards.tsx、ScriptViewScriptPanel.tsx、ScriptViewRuntime.tsx、ScriptViewCore.tsx、ScriptViewContainer.tsx、ScriptViewAssetsPanel.tsx、clip-asset-utils.ts、asset-state-utils.ts 已统一改成 renderer shell。
5. 新增 guards：legacy-novel-promotion-video-stage-shell-guard.mjs、legacy-novel-promotion-voice-stage-shell-guard.mjs、legacy-novel-promotion-prompts-stage-shell-guard.mjs、legacy-novel-promotion-script-view-shell-guard.mjs，并接入 package.json 的 check:* 与 test:guards。
6. 多轮 npm run desktop:build:web 通过，说明这四组目录壳化后未引入新的签名差异或构建阻断。

结果：旧 compat 树已从 root/stage/workspace 三层壳，继续扩展到多组高频子目录也空心化。后续优先看 components/video、components/voice，以及最终的 components/storyboard 目录级壳化。