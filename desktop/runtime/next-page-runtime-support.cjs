const path = require('node:path')
const querystring = require('node:querystring')
const { addRequestMeta } = require('next/dist/server/request-meta')

const NEXT_INTL_LOCALE_HEADER = 'x-next-intl-locale'

let nextPageNodeEnvironmentReady = false

function toQueryObject(search) {
  if (!search) {
    return {}
  }
  return querystring.parse(search.startsWith('?') ? search.slice(1) : search)
}

function assertNextPageRuntimeDependencies({ runtime, assertModuleResolvable }) {
  assertModuleResolvable('next', runtime.appRoot)
  assertModuleResolvable('sharp', runtime.appRoot)
}

async function smokeTestNextPageRuntimeDependencies({ app, runtime, runNodeOnce }) {
  if (!app.isPackaged) return

  await runNodeOnce({
    name: 'deps-smoke-next-page-runtime',
    appRoot: runtime.appRoot,
    logsDir: runtime.logsDir,
    runtimeEnv: runtime.runtimeEnv,
    args: [
      '-e',
      "require('next'); require('sharp')",
    ],
  })
}

function ensureNextPageNodeEnvironment() {
  if (nextPageNodeEnvironmentReady) {
    return
  }
  // Next 的页面产物依赖这层 Node 运行时初始化来安装 AsyncLocalStorage、
  // WebSocket 和若干全局扩展；缺失时 page handler 会直接抛 E504。
  require('next/dist/server/node-environment')
  nextPageNodeEnvironmentReady = true
}

function applyNextPageRequestMeta({ nodeReq, nodeRes, requestUrl, matched, appRoot }) {
  const query = toQueryObject(requestUrl.search)
  const locale = typeof matched.params?.locale === 'string' ? matched.params.locale : undefined
  const relativeProjectDir = path.relative(process.cwd(), appRoot)

  nodeReq.originalRequest = nodeReq
  nodeRes.originalResponse = nodeRes

  addRequestMeta(nodeReq, 'initURL', requestUrl.toString())
  addRequestMeta(nodeReq, 'initQuery', { ...query })
  addRequestMeta(nodeReq, 'initProtocol', requestUrl.protocol.replace(/:$/, ''))
  addRequestMeta(nodeReq, 'relativeProjectDir', relativeProjectDir)
  addRequestMeta(nodeReq, 'distDir', path.join(appRoot, '.next'))
  addRequestMeta(nodeReq, 'middlewareInvoke', false)
  addRequestMeta(nodeReq, 'minimalMode', false)
  addRequestMeta(nodeReq, 'query', { ...query })
  addRequestMeta(nodeReq, 'params', { ...matched.params })
  addRequestMeta(nodeReq, 'invokePath', matched.page.routePath)
  addRequestMeta(nodeReq, 'invokeQuery', { ...matched.params, ...query })
  addRequestMeta(nodeReq, 'rewroteURL', requestUrl.pathname)

  if (locale) {
    addRequestMeta(nodeReq, 'locale', locale)
    addRequestMeta(nodeReq, 'defaultLocale', locale)
    if (!nodeReq.headers[NEXT_INTL_LOCALE_HEADER]) {
      nodeReq.headers[NEXT_INTL_LOCALE_HEADER] = locale
    }
  }
}

function applyNextRouteRequestMeta({ nodeReq, requestUrl, matched, appRoot }) {
  const query = toQueryObject(requestUrl.search)
  const relativeProjectDir = path.relative(process.cwd(), appRoot)

  addRequestMeta(nodeReq, 'initURL', requestUrl.toString())
  addRequestMeta(nodeReq, 'initQuery', { ...query })
  addRequestMeta(nodeReq, 'initProtocol', requestUrl.protocol.replace(/:$/, ''))
  addRequestMeta(nodeReq, 'relativeProjectDir', relativeProjectDir)
  addRequestMeta(nodeReq, 'distDir', path.join(appRoot, '.next'))
  addRequestMeta(nodeReq, 'middlewareInvoke', false)
  addRequestMeta(nodeReq, 'minimalMode', false)
  addRequestMeta(nodeReq, 'query', { ...query })
  addRequestMeta(nodeReq, 'params', { ...matched.params })
  addRequestMeta(nodeReq, 'invokePath', matched.route.routePath)
  addRequestMeta(nodeReq, 'invokeQuery', { ...matched.params, ...query })
  addRequestMeta(nodeReq, 'rewroteURL', requestUrl.pathname)
}

module.exports = {
  NEXT_INTL_LOCALE_HEADER,
  applyNextPageRequestMeta,
  applyNextRouteRequestMeta,
  assertNextPageRuntimeDependencies,
  ensureNextPageNodeEnvironment,
  smokeTestNextPageRuntimeDependencies,
}
