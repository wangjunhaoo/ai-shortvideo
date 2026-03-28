import { isErrorResponse, requireUserAuth } from '@engine/api-auth'
import { readAllLogs } from '@/lib/logging/file-writer'

export async function handleDownloadAdminLogsRequest() {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult

  const logs = await readAllLogs()
  if (!logs) {
    return Response.json({ error: 'No logs available' }, { status: 404 })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `waoowaoo-logs-${timestamp}.txt`

  return new Response(logs, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
