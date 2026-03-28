'use client'

import Navbar from '@/components/Navbar'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import type { TranslationFn } from './detail-types'

type ProjectDetailLoadingViewProps = {
  tc: TranslationFn
}

export function ProjectDetailLoadingView({ tc }: ProjectDetailLoadingViewProps) {
  return (
    <div className="glass-page min-h-screen">
      <Navbar />
      <main className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-[var(--glass-text-secondary)]">{tc('loading')}</div>
      </main>
    </div>
  )
}

type ProjectDetailErrorViewProps = {
  message: string
  onBack: () => void
  t: TranslationFn
}

export function ProjectDetailErrorView({
  message,
  onBack,
  t,
}: ProjectDetailErrorViewProps) {
  return (
    <div className="glass-page min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="glass-surface p-6 text-center">
          <p className="text-[var(--glass-tone-danger-fg)] mb-4">{message}</p>
          <button
            onClick={onBack}
            className="glass-btn-base glass-btn-primary px-6 py-2"
          >
            {t('backToWorkspace')}
          </button>
        </div>
      </main>
    </div>
  )
}
