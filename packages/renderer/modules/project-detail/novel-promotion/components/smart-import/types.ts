export interface SplitEpisode {
  number: number
  title: string
  summary: string
  content: string
  wordCount: number
}

export type WizardStage = 'select' | 'analyzing' | 'preview'

export interface DeleteConfirmState {
  show: boolean
  index: number
  title: string
}

export interface StepSourceLabels {
  markerDetectedTitle: string
  markerDetectedDescription: (count: number, type: string) => string
  markerTypeLabel: (typeKey: string) => string
  markerPreviewLabel: string
  episodeLabel: (num: number) => string
  wordsLabel: string
  useMarkerLabel: string
  useMarkerDescription: string
  useAiLabel: string
  useAiDescription: string
  cancelLabel: string
  title: string
  subtitle: string
  manualCreateTitle: string
  manualCreateDescription: string
  manualCreateButtonLabel: string
  smartImportTitle: string
  smartImportDescription: string
  uploadPlaceholder: string
  startAnalysisLabel: string
}

export interface StepMappingLabels {
  deleteConfirmTitle: string
  deleteConfirmMessage: (title: string) => string
  deleteCancelLabel: string
  deleteConfirmLabel: string
  episodeListLabel: string
  episodeLabel: (num: number) => string
  wordsLabel: string
  deleteEpisodeTitle: string
  episodePlaceholder: string
  summaryPlaceholder: string
  addEpisodeLabel: string
  averageWordsLabel: string
  episodeContentLabel: string
  plotSummaryLabel: string
}

export interface StepConfirmLabels {
  title: string
  episodeCountLabel: (count: number) => string
  totalWordsLabel: (count: string) => string
  autoSavedLabel: string
  reanalyzeLabel: string
  savingLabel: string
  confirmLabel: string
  confirmAndAnalyzeLabel: string
}

export interface StepParseLabels {
  title: string
  description: string
  autoSaveLabel: string
}
