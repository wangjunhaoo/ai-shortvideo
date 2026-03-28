import {
  JSON_HEADERS,
  rendererApiRequest as apiFetch,
} from '@renderer/clients/http-client'
import { apiConfigRoutes } from '@shared/contracts/renderer-api-routes'

export function getUserApiConfig() {
  return apiFetch(apiConfigRoutes.root)
}

export function updateUserApiConfig(payload: object) {
  return apiFetch(apiConfigRoutes.root, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}

export function testUserApiProvider(payload: object) {
  return apiFetch(apiConfigRoutes.testProvider, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}

export function probeUserApiConfigModelLlmProtocol(payload: {
  providerId: string
  modelId: string
}) {
  return apiFetch(apiConfigRoutes.probeModelLlmProtocol, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}
