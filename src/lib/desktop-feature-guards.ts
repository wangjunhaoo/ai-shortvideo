import { getErrorSpec } from '@/lib/errors/codes'
import { isBillingFeatureEnabled } from '@/lib/runtime-mode'

const BILLING_DISABLED_MESSAGE = '桌面单机版未启用计费能力'
const NOT_FOUND_SPEC = getErrorSpec('NOT_FOUND')

export function getBillingFeatureDisabledResponse() {
  if (isBillingFeatureEnabled()) return null

  return Response.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: BILLING_DISABLED_MESSAGE,
        retryable: NOT_FOUND_SPEC.retryable,
        category: NOT_FOUND_SPEC.category,
        userMessageKey: NOT_FOUND_SPEC.userMessageKey,
        details: {},
      },
      code: 'NOT_FOUND',
      message: BILLING_DISABLED_MESSAGE,
    },
    { status: NOT_FOUND_SPEC.httpStatus },
  )
}
