import {
  JSON_HEADERS,
  rendererApiRequest as apiFetch,
} from '@renderer/clients/http-client'
import { runRoutes, withQuery } from '@shared/contracts/renderer-api-routes'

export function listRuns(params: URLSearchParams) {
  return apiFetch(withQuery(runRoutes.root, params), {
    method: 'GET',
    cache: 'no-store',
  })
}

export function getRun(runId: string) {
  return apiFetch(runRoutes.detail(runId), {
    method: 'GET',
    cache: 'no-store',
  })
}

export function listRunEvents(
  runId: string,
  params: {
    afterSeq: number
    limit: number
  },
) {
  return apiFetch(withQuery(runRoutes.events(runId), params), {
    method: 'GET',
    cache: 'no-store',
  })
}

export function retryRunStep(
  runId: string,
  stepId: string,
  payload: {
    modelOverride?: string
    reason?: string
  },
) {
  return apiFetch(runRoutes.retryStep(runId, stepId), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      modelOverride: payload.modelOverride || undefined,
      reason: payload.reason || undefined,
    }),
  })
}

export function cancelRun(runId: string) {
  return apiFetch(runRoutes.cancel(runId), {
    method: 'POST',
  })
}
