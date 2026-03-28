import { apiHandler } from '@/lib/api-errors'
import { handleAssistantChatRequest } from '@engine/services/assistant-chat-route-service'

export const POST = apiHandler(async (request: Request) => handleAssistantChatRequest(request))
