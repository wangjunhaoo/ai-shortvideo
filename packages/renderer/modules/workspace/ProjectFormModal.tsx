'use client'

import { Link } from '@/i18n/navigation'
import { AppIcon } from '@/components/ui/icons'

type ProjectFormModalProps = {
  mode: 'create' | 'edit'
  visible: boolean
  loading: boolean
  name: string
  description: string
  modelNotConfigured?: boolean
  onClose: () => void
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSubmit: (event: React.FormEvent) => void
  t: (key: string, values?: Record<string, string | number | Date>) => string
  tc: (key: string, values?: Record<string, string | number | Date>) => string
}

export function ProjectFormModal({
  mode,
  visible,
  loading,
  name,
  description,
  modelNotConfigured = false,
  onClose,
  onNameChange,
  onDescriptionChange,
  onSubmit,
  t,
  tc,
}: ProjectFormModalProps) {
  if (!visible) return null

  const isCreateMode = mode === 'create'
  const title = isCreateMode ? t('createProject') : t('editProject')
  const submitText = isCreateMode
    ? (loading ? t('creating') : t('createProject'))
    : (loading ? t('saving') : tc('save'))
  const nameInputId = isCreateMode ? 'name' : 'edit-name'
  const descriptionInputId = isCreateMode ? 'description' : 'edit-description'

  return (
    <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="glass-surface-modal p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-[var(--glass-text-primary)] mb-4">{title}</h2>
        {isCreateMode && modelNotConfigured && (
          <div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
            <AppIcon name="alert" className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="text-[12px] leading-relaxed">
              {t('modelNotConfigured.before')}
              <Link
                href={{ pathname: '/profile' }}
                className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-300 mx-0.5"
                onClick={onClose}
              >
                {t('modelNotConfigured.link')}
              </Link>
              {t('modelNotConfigured.after')}
            </span>
          </div>
        )}
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label htmlFor={nameInputId} className="glass-field-label block mb-2">
              {t('projectName')} *
            </label>
            <input
              id={nameInputId}
              type="text"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              className="glass-input-base w-full px-3 py-2"
              placeholder={t('projectNamePlaceholder')}
              maxLength={100}
              required
              autoFocus={isCreateMode}
            />
          </div>
          <div className="mb-6">
            <label htmlFor={descriptionInputId} className="glass-field-label block mb-2">
              {t('projectDescription')}
            </label>
            <textarea
              id={descriptionInputId}
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              className="glass-textarea-base w-full px-3 py-2"
              placeholder={t('projectDescriptionPlaceholder')}
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="glass-btn-base glass-btn-secondary px-4 py-2"
              disabled={loading}
            >
              {tc('cancel')}
            </button>
            <button
              type="submit"
              className="glass-btn-base glass-btn-primary px-4 py-2 disabled:opacity-50"
              disabled={loading || !name.trim()}
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
