import { apiHandler } from '@/lib/api-errors'
import {
  handleGetUserApiConfigRequest,
  handleUpdateUserApiConfigRequest,
} from '@engine/services/user-api-config-route-service'

export const GET = apiHandler(handleGetUserApiConfigRequest)

export const PUT = apiHandler(handleUpdateUserApiConfigRequest)
