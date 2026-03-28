import { apiHandler } from '@/lib/api-errors'
import { handleTestProviderConnectionRequest } from '@engine/services/user-api-config-route-service'

export const POST = apiHandler(handleTestProviderConnectionRequest)

