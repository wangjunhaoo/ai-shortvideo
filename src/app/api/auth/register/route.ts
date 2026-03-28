import { apiHandler } from '@/lib/api-errors'
import { handleRegisterUserRequest } from '@engine/services/auth-register-route-service'

export const POST = apiHandler(handleRegisterUserRequest)
