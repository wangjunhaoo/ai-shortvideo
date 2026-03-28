'use client'

import { createPortal } from 'react-dom'
import { AppIcon } from '@/components/ui/icons'
import InsertPanelModalActions from './InsertPanelModalActions'
import InsertPanelModalPanelsPreview from './InsertPanelModalPanelsPreview'
import type { InsertPanelModalProps } from './InsertPanelModal.types'
import { useInsertPanelModalState } from './hooks/useInsertPanelModalState'

export default function InsertPanelModal({
  isOpen,
  onClose,
  prevPanel,
  nextPanel,
  labels,
  onInsert,
  isInserting,
}: InsertPanelModalProps) {
  const {
    userInput,
    setUserInput,
    mounted,
    analyzingState,
    insertingState,
    handleInsert,
    handleAutoAnalyze,
    handleClose,
  } = useInsertPanelModalState({
    isInserting,
    onClose,
    onInsert,
  })

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div
      className="fixed inset-0 glass-overlay flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={handleClose}
    >
      <div
        className="glass-surface-modal w-full max-w-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-[var(--glass-stroke-base)] bg-[var(--glass-bg-surface-strong)] rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--glass-text-primary)] flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] text-sm font-bold">
                +
              </span>
              {labels.formatTitle(
                prevPanel.panelNumber ?? 0,
                nextPanel?.panelNumber ?? '',
              )}
            </h2>
            <button
              onClick={handleClose}
              disabled={isInserting}
              className="text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)] disabled:opacity-50"
            >
              <AppIcon name="close" className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <InsertPanelModalPanelsPreview
            labels={labels.preview}
            prevPanel={prevPanel}
            nextPanel={nextPanel}
          />

          <div>
            <textarea
              value={userInput}
              onChange={(event) => setUserInput(event.target.value)}
              placeholder={labels.placeholder}
              className="w-full h-16 px-3 py-2 border border-[var(--glass-stroke-base)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--glass-tone-info-fg)] text-sm"
              disabled={isInserting}
            />
          </div>

          <InsertPanelModalActions
            labels={labels.actions}
            isInserting={isInserting}
            userInput={userInput}
            analyzingState={analyzingState}
            insertingState={insertingState}
            onAutoAnalyze={handleAutoAnalyze}
            onInsert={handleInsert}
          />
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
