const path = require('node:path')
const {
  createMatcher,
  loadJsonFile,
} = require('./module-dispatcher-support.cjs')
const {
  applyNextRouteRequestMeta,
  ensureNextPageNodeEnvironment,
} = require('./next-page-runtime-support.cjs')

const APP_PATHS_MANIFEST_PATH = path.join('.next', 'server', 'app-paths-manifest.json')
const DISPATCHED_ROUTE_PREFIXES = ['/api/', '/m/']

function stripRouteSuffix(routeKey) {
  return routeKey.endsWith('/route') ? routeKey.slice(0, -'/route'.length) : routeKey
}

function loadRouteManifest(appRoot) {
  const manifest = loadJsonFile(
    path.join(appRoot, APP_PATHS_MANIFEST_PATH),
    '缺少 Next 构建路由清单',
  )
  return Object.entries(manifest)
    .filter(([routeKey]) => {
      if (!routeKey.endsWith('/route')) return false
      const routePath = stripRouteSuffix(routeKey)
      return DISPATCHED_ROUTE_PREFIXES.some((prefix) => routePath === prefix.slice(0, -1) || routePath.startsWith(prefix))
    })
    .map(([routeKey, buildPath]) => {
      const routePath = stripRouteSuffix(routeKey)
      return {
        routeKey,
        routePath,
        buildPath: path.join(appRoot, '.next', 'server', buildPath),
        matcher: createMatcher(routePath),
      }
    })
    .sort((left, right) => right.matcher.score - left.matcher.score || right.routePath.length - left.routePath.length)
}

function createRouteModuleDispatcher({ appRoot, runtimeBaseUrl }) {
  const routes = loadRouteManifest(appRoot)
  const moduleCache = new Map()

  function matchRoute(pathname) {
    for (const route of routes) {
      const params = route.matcher.match(pathname)
      if (params) {
        return { route, params }
      }
    }
    return null
  }

  function loadCompiledRouteHandler(route) {
    if (!moduleCache.has(route.buildPath)) {
      // App Route 编译产物和页面产物共享 Next 的 AsyncLocalStorage 运行时。
      // 只要先 require 任意 route.js，再补 node-environment 就已经晚了，
      // async-local-storage 模块会把“未初始化”的状态缓存成假实现。
      ensureNextPageNodeEnvironment()
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const mod = require(route.buildPath)
      const handler = mod?.handler
      if (typeof handler !== 'function') {
        throw new Error(`无法解析路由模块：${route.buildPath}`)
      }
      moduleCache.set(route.buildPath, handler)
    }
    return moduleCache.get(route.buildPath)
  }

  return {
    async tryHandle(nodeReq, nodeRes) {
      const requestUrl = new URL(nodeReq.url || '/', runtimeBaseUrl)
      const matched = matchRoute(requestUrl.pathname)
      if (!matched) {
        return false
      }

      const handler = loadCompiledRouteHandler(matched.route)
      applyNextRouteRequestMeta({
        nodeReq,
        requestUrl,
        matched,
        appRoot,
      })
      await handler(nodeReq, nodeRes, {
        waitUntil(promise) {
          return Promise.resolve(promise).catch((error) => {
            console.error('[desktop][route-module-dispatcher] waitUntil 失败', error)
          })
        },
      })

      if (!nodeRes.writableEnded) {
        throw new Error(`路由 ${matched.route.routeKey} 未结束响应`)
      }
      return true
    },
  }
}

module.exports = {
  createRouteModuleDispatcher,
}
