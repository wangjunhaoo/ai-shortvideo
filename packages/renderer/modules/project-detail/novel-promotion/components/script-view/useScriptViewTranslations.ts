'use client'

import { useTranslations } from 'next-intl'
import { toTranslationValues } from './types'

export function useScriptViewTranslations() {
  const t = useTranslations('smartImport')
  const tAssets = useTranslations('assets')
  const tNP = useTranslations('novelPromotion')
  const tScript = useTranslations('scriptView')
  const tCommon = useTranslations('common')

  return {
    t: (key: string, values?: Record<string, unknown>) => t(key, toTranslationValues(values)),
    tAssets: (key: string, values?: Record<string, unknown>) =>
      tAssets(key, toTranslationValues(values)),
    tNP: (key: string, values?: Record<string, unknown>) =>
      tNP(key, toTranslationValues(values)),
    tScript: (key: string, values?: Record<string, unknown>) =>
      tScript(key, toTranslationValues(values)),
    tCommon: (key: string, values?: Record<string, unknown>) =>
      tCommon(key, toTranslationValues(values)),
  }
}
