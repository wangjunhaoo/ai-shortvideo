import { apiHandler } from '@/lib/api-errors'
import { handleTestApiConfigConnectionRequest } from '@engine/services/user-api-config-route-service'

export const POST = apiHandler(handleTestApiConfigConnectionRequest)

