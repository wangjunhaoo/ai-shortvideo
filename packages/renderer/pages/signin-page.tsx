'use client'

import { useGuestRendererSession } from '@renderer/auth/client'
import { RendererSessionPendingScreen } from '@renderer/auth/RendererSessionPendingScreen'
import { useSignInForm } from '@renderer/modules/auth/useSignInForm'
import { useTranslations } from 'next-intl'
import Navbar from '@/components/Navbar'
import { Link } from '@/i18n/navigation'

export default function SignInPage() {
  const t = useTranslations('auth')
  const { canRenderGuest, isLoading } = useGuestRendererSession()
  const form = useSignInForm(t)

  if (isLoading || !canRenderGuest) {
    return <RendererSessionPendingScreen label={t('loginButtonLoading')} />
  }

  return (
    <div className="glass-page min-h-screen">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="glass-surface-modal p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[var(--glass-text-primary)] mb-2">
                {t('welcomeBack')}
              </h1>
              <p className="text-[var(--glass-text-secondary)]">{t('loginTo')}</p>
            </div>

            <form onSubmit={form.handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="glass-field-label block mb-2">
                  {t('phoneNumber')}
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={form.username}
                  onChange={(event) => form.updateField('username', event.target.value)}
                  required
                  className="glass-input-base w-full px-4 py-3"
                  placeholder={t('phoneNumberPlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="password" className="glass-field-label block mb-2">
                  {t('password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(event) => form.updateField('password', event.target.value)}
                  required
                  className="glass-input-base w-full px-4 py-3"
                  placeholder={t('passwordPlaceholder')}
                />
              </div>

              {form.error ? (
                <div className="bg-[var(--glass-tone-danger-bg)] border border-[color:color-mix(in_srgb,var(--glass-tone-danger-fg)_22%,transparent)] text-[var(--glass-tone-danger-fg)] px-4 py-3 rounded-lg text-sm">
                  {form.error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={form.loading}
                className="glass-btn-base glass-btn-primary w-full py-3 px-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {form.loading ? t('loginButtonLoading') : t('loginButton')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[var(--glass-text-secondary)]">
                {t('noAccount')}{' '}
                <Link href={{ pathname: '/auth/signup' }} className="text-[var(--glass-tone-info-fg)] hover:underline font-medium">
                  {t('signupNow')}
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link href={{ pathname: '/' }} className="text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)] text-sm">
                {t('backToHome')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
