const AUTH_COMPAT_SUNSET = 'Tue, 30 Jun 2026 00:00:00 GMT'

function withCompatRemovedHeaders(response: Response) {
  response.headers.set('Deprecation', 'true')
  response.headers.set('Sunset', AUTH_COMPAT_SUNSET)
  response.headers.set('X-Auth-Compat-Route', 'removed')
  response.headers.set('Link', '</api/auth/session>; rel="successor-version"')
  return response
}

function createCompatRemovedResponse() {
  return withCompatRemovedHeaders(
    Response.json(
      {
        success: false,
        error: {
          code: 'AUTH_COMPAT_ROUTE_REMOVED',
          message: 'Legacy auth catch-all route has been removed. Use /api/auth/session, /api/auth/csrf, /api/auth/login or /api/auth/logout.',
        },
      },
      { status: 410 },
    ),
  )
}

export async function GET() {
  return createCompatRemovedResponse()
}

export async function POST() {
  return createCompatRemovedResponse()
}

