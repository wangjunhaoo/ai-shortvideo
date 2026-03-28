import { apiHandler } from '@/lib/api-errors'
import { handleValidateMediaTemplateRequest } from '@engine/services/user-api-config-route-service'

export const POST = apiHandler(handleValidateMediaTemplateRequest)


