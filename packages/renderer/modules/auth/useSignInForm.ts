import { useCallback, useState } from 'react'
import { rendererSignIn } from '@renderer/auth/client'
import { type TranslationFn } from '@renderer/modules/workspace/types'
import { useRouter } from '@/i18n/navigation'

type SignInField = 'username' | 'password'

export function useSignInForm(t: TranslationFn) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateField = useCallback((field: SignInField, value: string) => {
    if (field === 'username') {
      setUsername(value)
      return
    }
    setPassword(value)
  }, [])

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await rendererSignIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (result?.error === 'RateLimited') {
        setError(t('rateLimited'))
        return
      }

      if (result?.error) {
        setError(t('loginFailed'))
        return
      }

      router.push({ pathname: '/' })
      router.refresh()
    } catch {
      setError(t('loginError'))
    } finally {
      setLoading(false)
    }
  }, [password, router, t, username])

  return {
    username,
    password,
    loading,
    error,
    updateField,
    handleSubmit,
  }
}
