import { apiHandler } from '@/lib/api-errors'
import { handleDownloadAdminLogsRequest } from '@engine/services/admin-log-route-service'

export const dynamic = 'force-dynamic'

export const GET = apiHandler(async () => handleDownloadAdminLogsRequest())
