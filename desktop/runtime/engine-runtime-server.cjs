const http = require('node:http')
const { createRouteModuleDispatcher } = require('./route-module-dispatcher.cjs')
const { createPageModuleDispatcher } = require('./page-module-dispatcher.cjs')
const { createStaticAssetDispatcher } = require('./static-asset-dispatcher.cjs')

const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE || 'zh'
const SUPPORTED_LOCALES = ['zh', 'en']

function serializeRuntimeError(error) {
  if (!(error instanceof Error)) {
    return {
      message: String(error),
    }
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    digest: typeof error.digest === 'string' ? error.digest : undefined,
    cause: error.cause instanceof Error
      ? {
        name: error.cause.name,
        message: error.cause.message,
        stack: error.cause.stack,
      }
      : error.cause,
  }
}

function resolvePort() {
  const baseUrl = process.env.APP_BASE_URL || process.env.INTERNAL_APP_URL
  if (baseUrl) {
    const parsed = new URL(baseUrl)
    const port = Number(parsed.port)
    if (Number.isFinite(port) && port > 0) {
      return port
    }
  }
  const port = Number(process.env.PORT || 3000)
  return Number.isFinite(port) && port > 0 ? port : 3000
}

async function bootstrap() {
  const appRoot = require('node:path').resolve(__dirname, '..', '..')
  const port = resolvePort()
  const runtimeBaseUrl = `http://127.0.0.1:${port}`

  const dispatcher = createRouteModuleDispatcher({
    appRoot,
    runtimeBaseUrl,
  })
  const pageDispatcher = createPageModuleDispatcher({ appRoot })
  const staticAssetDispatcher = createStaticAssetDispatcher({ appRoot })

  function maybeHandleLocaleRedirect(nodeRes, requestUrl) {
    const { pathname, search } = requestUrl
    if (pathname === '/') {
      nodeRes.statusCode = 307
      nodeRes.setHeader('location', `/${DEFAULT_LOCALE}${search || ''}`)
      nodeRes.end()
      return true
    }

    const segments = pathname.split('/').filter(Boolean)
    const firstSegment = segments[0]
    if (segments.length > 0 && !SUPPORTED_LOCALES.includes(firstSegment)) {
      nodeRes.statusCode = 307
      nodeRes.setHeader('location', `/${DEFAULT_LOCALE}${pathname}${search || ''}`)
      nodeRes.end()
      return true
    }

    return false
  }

  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', runtimeBaseUrl)
      const staticHandled = await staticAssetDispatcher.tryHandle(req, res, requestUrl)
      if (staticHandled) {
        return
      }

      const handled = await dispatcher.tryHandle(req, res)
      if (handled) {
        return
      }

      if (maybeHandleLocaleRedirect(res, requestUrl)) {
        return
      }

      const pageHandled = await pageDispatcher.tryHandle(req, res, requestUrl)
      if (pageHandled) {
        return
      }

      res.statusCode = 404
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `未找到路径：${requestUrl.pathname}`,
        },
      }))
    } catch (error) {
      console.error(
        '[desktop][engine-runtime-server] 请求处理失败',
        serializeRuntimeError(error),
      )
      if (!res.headersSent) {
        res.statusCode = 500
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : String(error),
          },
        }))
        return
      }
      res.destroy(error instanceof Error ? error : new Error(String(error)))
    }
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolve)
  })

  const shutdown = async () => {
    await new Promise((resolve) => server.close(() => resolve()))
  }

  process.on('SIGINT', () => {
    void shutdown().finally(() => process.exit(0))
  })
  process.on('SIGTERM', () => {
    void shutdown().finally(() => process.exit(0))
  })

  console.log(`[desktop][engine-runtime-server] listening on ${runtimeBaseUrl}`)
}

void bootstrap().catch((error) => {
  console.error('[desktop][engine-runtime-server] 启动失败', error)
  process.exit(1)
})
