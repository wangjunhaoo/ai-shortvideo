'use client'

import TaskStatusInline from '@/components/task/TaskStatusInline'
import { ModelCapabilityDropdown } from '@/components/ui/config-modals/ModelCapabilityDropdown'
import { AppIcon } from '@/components/ui/icons'
import SmartImportWizard, { type SplitEpisode } from '@renderer/modules/project-detail/novel-promotion/components/SmartImportWizard'
import type { TranslationFn } from './detail-types'

type ProjectDetailImportGateProps = {
  isCheckingModelSetup: boolean
  needsModelSetup: boolean
  isModelSetupModalOpen: boolean
  modelSetupSaving: boolean
  llmModelOptions: React.ComponentProps<typeof ModelCapabilityDropdown>['models']
  analysisModelDraft: string
  importStatus?: string
  projectId: string
  initLoadingState: React.ComponentProps<typeof TaskStatusInline>['state']
  onOpenModelSetup: () => void
  onCloseModelSetup: () => void
  onGoProfile: () => void
  onAnalysisModelDraftChange: (value: string) => void
  onSaveDefaultAnalysisModel: () => void
  onManualCreate: () => void
  onImportComplete: (splitEpisodes: SplitEpisode[], triggerGlobalAnalysis?: boolean) => void | Promise<void>
  t: TranslationFn
  tc: TranslationFn
}

export function ProjectDetailImportGate({
  isCheckingModelSetup,
  needsModelSetup,
  isModelSetupModalOpen,
  modelSetupSaving,
  llmModelOptions,
  analysisModelDraft,
  importStatus,
  projectId,
  initLoadingState,
  onOpenModelSetup,
  onCloseModelSetup,
  onGoProfile,
  onAnalysisModelDraftChange,
  onSaveDefaultAnalysisModel,
  onManualCreate,
  onImportComplete,
  t,
  tc,
}: ProjectDetailImportGateProps) {
  if (isCheckingModelSetup) {
    return (
      <div className="glass-surface p-8 text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center bg-[var(--glass-bg-muted)] text-[var(--glass-text-tertiary)]">
          <TaskStatusInline state={initLoadingState} className="[&>span]:sr-only" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--glass-text-secondary)] mb-2">{tc('loading')}</h2>
      </div>
    )
  }

  if (needsModelSetup) {
    return (
      <div className="glass-surface p-8 max-w-2xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--glass-tone-warning-bg)] text-[var(--glass-tone-warning-fg)] flex items-center justify-center shrink-0">
            <AppIcon name="alert" className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-[var(--glass-text-primary)] mb-2">
              {t('modelSetup.title')}
            </h2>
            <p className="text-[var(--glass-text-secondary)] mb-5">
              {t('modelSetup.description')}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onOpenModelSetup}
                className="glass-btn-base glass-btn-primary px-4 py-2"
              >
                {t('modelSetup.configureNow')}
              </button>
              <button
                onClick={onGoProfile}
                className="glass-btn-base glass-btn-secondary px-4 py-2"
              >
                {t('modelSetup.goProfile')}
              </button>
            </div>
          </div>
        </div>

        {isModelSetupModalOpen && (
          <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="glass-surface-modal p-6 w-full max-w-xl mx-4">
              <h3 className="text-xl font-bold text-[var(--glass-text-primary)] mb-2">
                {t('modelSetup.modalTitle')}
              </h3>
              <p className="text-sm text-[var(--glass-text-secondary)] mb-5">
                {t('modelSetup.modalDescription')}
              </p>

              <div className="mb-6">
                <label className="glass-field-label block mb-2">{t('modelSetup.selectModelLabel')}</label>
                {llmModelOptions.length === 0 ? (
                  <div className="text-sm text-[var(--glass-tone-warning-fg)]">
                    {t('modelSetup.noModelOptions')}
                  </div>
                ) : (
                  <ModelCapabilityDropdown
                    models={llmModelOptions}
                    value={analysisModelDraft || undefined}
                    onModelChange={onAnalysisModelDraftChange}
                    capabilityFields={[]}
                    capabilityOverrides={{}}
                    onCapabilityChange={(field, rawValue, sample) => {
                      void field
                      void rawValue
                      void sample
                    }}
                    placeholder={t('modelSetup.selectModelPlaceholder')}
                  />
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onCloseModelSetup}
                  className="glass-btn-base glass-btn-secondary px-4 py-2"
                  disabled={modelSetupSaving}
                >
                  {tc('cancel')}
                </button>
                <button
                  type="button"
                  onClick={onSaveDefaultAnalysisModel}
                  className="glass-btn-base glass-btn-primary px-4 py-2 disabled:opacity-50"
                  disabled={modelSetupSaving || llmModelOptions.length === 0 || !analysisModelDraft.trim()}
                >
                  {modelSetupSaving ? tc('loading') : tc('save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <SmartImportWizard
      projectId={projectId}
      onManualCreate={onManualCreate}
      onImportComplete={onImportComplete}
      importStatus={importStatus}
    />
  )
}
