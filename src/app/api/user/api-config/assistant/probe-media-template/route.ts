import { apiHandler } from '@/lib/api-errors'
import { handleProbeMediaTemplateRequest } from '@engine/services/user-api-config-route-service'

export const POST = apiHandler(handleProbeMediaTemplateRequest)


