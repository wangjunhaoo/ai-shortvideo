'use client'

import { useGuestRendererSession } from '@renderer/auth/client'
import { RendererSessionPendingScreen } from '@renderer/auth/RendererSessionPendingScreen'
import { useSignUpForm } from '@renderer/modules/auth/useSignUpForm'
import { useTranslations } from 'next-intl'
import Navbar from '@/components/Navbar'
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator'
import { Link } from '@/i18n/navigation'

export default function SignUpPage() {
  const t = useTranslations('auth')
  const { canRenderGuest, isLoading } = useGuestRendererSession()
  const form = useSignUpForm(t)

  if (isLoading || !canRenderGuest) {
    return <RendererSessionPendingScreen label={t('signupButtonLoading')} />
  }

  return (
    <div className="glass-page min-h-screen">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="glass-surface-modal p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[var(--glass-text-primary)] mb-2">
                {t('createAccount')}
              </h1>
              <p className="text-[var(--glass-text-secondary)]">{t('joinPlatform')}</p>
            </div>

            <form onSubmit={form.handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="glass-field-label block mb-2">
                  {t('phoneNumber')}
                </label>
                <input
                  id="name"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={form.name}
                  onChange={(event) => form.updateField('name', event.target.value)}
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
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => form.updateField('password', event.target.value)}
                  required
                  className="glass-input-base w-full px-4 py-3"
                  placeholder={t('passwordMinPlaceholder')}
                />
                <PasswordStrengthIndicator password={form.password} />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="glass-field-label block mb-2">
                  {t('confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) => form.updateField('confirmPassword', event.target.value)}
                  required
                  className="glass-input-base w-full px-4 py-3"
                  placeholder={t('confirmPasswordPlaceholder')}
                />
              </div>

              {form.error ? (
                <div className="bg-[var(--glass-tone-danger-bg)] border border-[color:color-mix(in_srgb,var(--glass-tone-danger-fg)_22%,transparent)] text-[var(--glass-tone-danger-fg)] px-4 py-3 rounded-lg text-sm">
                  {form.error}
                </div>
              ) : null}

              {form.success ? (
                <div className="bg-[var(--glass-tone-success-bg)] border border-[color:color-mix(in_srgb,var(--glass-tone-success-fg)_22%,transparent)] text-[var(--glass-tone-success-fg)] px-4 py-3 rounded-lg text-sm">
                  {form.success}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={form.loading}
                className="glass-btn-base glass-btn-primary w-full py-3 px-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {form.loading ? t('signupButtonLoading') : t('signupButton')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[var(--glass-text-secondary)]">
                {t('hasAccount')}{' '}
                <Link href={{ pathname: '/auth/signin' }} className="text-[var(--glass-tone-info-fg)] hover:underline font-medium">
                  {t('signinNow')}
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
