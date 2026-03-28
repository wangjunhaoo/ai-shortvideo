import { useCallback, useState } from 'react'
import { type TranslationFn } from '@renderer/modules/workspace/types'
import { registerUser } from '@renderer/clients/auth-client'
import { useRouter } from '@/i18n/navigation'

type SignUpField = 'name' | 'password' | 'confirmPassword'

export function useSignUpForm(t: TranslationFn) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const updateField = useCallback((field: SignUpField, value: string) => {
    if (field === 'name') {
      setName(value)
      return
    }
    if (field === 'password') {
      setPassword(value)
      return
    }
    setConfirmPassword(value)
  }, [])

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'))
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t('passwordTooShort'))
      setLoading(false)
      return
    }

    try {
      const response = await registerUser({
        name,
        password,
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(t('signupSuccess'))
        setTimeout(() => {
          router.push({ pathname: '/auth/signin' })
        }, 2000)
        return
      }

      setError(data.message || t('signupFailed'))
    } catch {
      setError(t('signupError'))
    } finally {
      setLoading(false)
    }
  }, [confirmPassword, name, password, router, t])

  return {
    name,
    password,
    confirmPassword,
    loading,
    error,
    success,
    updateField,
    handleSubmit,
  }
}
