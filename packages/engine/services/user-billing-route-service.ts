import { getBalance, getUserCostDetails } from '@/lib/billing'
import { BILLING_CURRENCY } from '@/lib/billing/currency'
import { getBillingFeatureDisabledResponse } from '@/lib/desktop-feature-guards'
import { isErrorResponse, requireUserAuth } from '@engine/api-auth'
import {
  getUserCostsPayload,
  getUserTransactionsPayload,
} from '@engine/services/billing-query-service'

function readPage(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || `${fallback}`, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

async function requireBillingUserSession() {
  const billingDisabledResponse = getBillingFeatureDisabledResponse()
  if (billingDisabledResponse) return billingDisabledResponse

  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  return authResult.session
}

export async function handleUserBalanceRequest() {
  const session = await requireBillingUserSession()
  if (session instanceof Response) return session

  const balance = await getBalance(session.user.id)
  return Response.json({
    success: true,
    currency: BILLING_CURRENCY,
    balance: balance.balance,
    frozenAmount: balance.frozenAmount,
    totalSpent: balance.totalSpent,
  })
}

export async function handleUserCostsRequest() {
  const session = await requireBillingUserSession()
  if (session instanceof Response) return session

  const payload = await getUserCostsPayload(session.user.id)
  return Response.json(payload)
}

export async function handleUserCostDetailsRequest(request: Request) {
  const session = await requireBillingUserSession()
  if (session instanceof Response) return session

  const { searchParams } = new URL(request.url)
  const page = readPage(searchParams.get('page'), 1, 1, 10_000)
  const pageSize = readPage(searchParams.get('pageSize'), 20, 1, 200)
  const result = await getUserCostDetails(session.user.id, page, pageSize)

  return Response.json({
    success: true,
    currency: BILLING_CURRENCY,
    ...result,
  })
}

export async function handleUserTransactionsRequest(request: Request) {
  const session = await requireBillingUserSession()
  if (session instanceof Response) return session

  const { searchParams } = new URL(request.url)
  const payload = await getUserTransactionsPayload({
    userId: session.user.id,
    page: readPage(searchParams.get('page'), 1, 1, 10_000),
    pageSize: readPage(searchParams.get('pageSize'), 20, 1, 200),
    type: searchParams.get('type'),
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
  })

  return Response.json(payload)
}
