import { apiHandler } from '@/lib/api-errors'
import { handleDismissTasksRequest } from '@engine/services/task-route-service'

export const POST = apiHandler(async (request: Request) => {
    return handleDismissTasksRequest(request)
})

