'use client'

export {
  useAiModifyProjectShotPrompt,
  useAnalyzeProjectAssets,
  useAnalyzeProjectVoice,
  useBatchGenerateVideos,
  useCreateProjectVoiceLine,
  useDesignProjectVoice,
  useDeleteProjectVoiceLine,
  useDownloadProjectVoices,
  useDownloadRemoteBlob,
  useFetchProjectVoiceStageData,
  useGenerateVideo,
  useGenerateProjectVoice,
  useGetProjectStoryboardStats,
  useListProjectEpisodeVideoUrls,
  useListProjectEpisodes,
  useLipSync,
  useMatchedVoiceLines,
  useSaveProjectEpisodesBatch,
  useSplitProjectEpisodes,
  useSplitProjectEpisodesByMarkers,
  useTaskList,
  useUpdateProjectClip,
  useUpdateProjectConfig,
  useUpdateProjectPanelActingNotes,
  useUpdateProjectPanelLink,
  useUpdateProjectPanelVideoPrompt,
  useUpdateProjectPhotographyPlan,
  useUpdateProjectEpisodeField,
  useUpdateProjectVoiceLine,
  useUpdateSpeakerVoice,
  useDismissFailedTasks,
  type MatchedVoiceLinesData,
} from './useRendererNovelPromotionRuntimeQueryHooks'

export {
  useStoryboardTaskPresentation,
  useVideoTaskPresentation,
  useVoiceTaskPresentation,
} from '@renderer/hooks/useRendererTaskPresentation'

export {
  useScriptToStoryboardRunStream,
} from './useScriptToStoryboardRunStream'

export {
  useStoryToScriptRunStream,
} from './useStoryToScriptRunStream'
