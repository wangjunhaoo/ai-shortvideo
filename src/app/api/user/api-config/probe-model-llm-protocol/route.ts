import { apiHandler } from '@/lib/api-errors'
import { handleProbeModelLlmProtocolRequest } from '@engine/services/user-api-config-route-service'

export const POST = apiHandler(handleProbeModelLlmProtocolRequest)

