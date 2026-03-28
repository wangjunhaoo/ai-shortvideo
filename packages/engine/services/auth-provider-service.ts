import {
  handleLocalAuthCsrfRequest,
  handleLocalAuthLoginRequest,
  handleLocalAuthLogoutRequest,
  handleLocalAuthSessionRequest,
  readLocalAuthSession,
} from '@engine/services/local-auth-provider-service'

export const authProviderConfig = {
  provider: 'local-cookie-session',
}

export async function readAuthProviderSession() {
  return readLocalAuthSession()
}

export async function handleAuthSessionRequest(request: Request) {
  return handleLocalAuthSessionRequest(request)
}

export async function handleAuthCsrfRequest(_request: Request) {
  return handleLocalAuthCsrfRequest()
}

export async function handleAuthLoginRequest(request: Request) {
  return handleLocalAuthLoginRequest(request)
}

export async function handleAuthLogoutRequest(request: Request) {
  return handleLocalAuthLogoutRequest(request)
}
