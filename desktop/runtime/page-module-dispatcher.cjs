const path = require('node:path')
const {
  createMatcher,
  loadJsonFile,
} = require('./module-dispatcher-support.cjs')
const {
  applyNextPageRequestMeta,
  ensureNextPageNodeEnvironment,
} = require('./next-page-runtime-support.cjs')

const APP_PATHS_MANIFEST_PATH = path.join('.next', 'server', 'app-paths-manifest.json')
const APP_PATH_ROUTES_MANIFEST_PATH = path.join('.next', 'app-path-routes-manifest.json')
const PAGE_ROUTE_EXCLUDE_PREFIXES = ['/api/', '/m/', '/_next/']
function shouldDispatchPage(routePath) {
  return !PAGE_ROUTE_EXCLUDE_PREFIXES.some((prefix) => routePath === prefix.slice(0, -1) || routePath.startsWith(prefix))
}

function loadPageManifest(appRoot) {
  const appPathsManifest = loadJsonFile(
    path.join(appRoot, APP_PATHS_MANIFEST_PATH),
    '缺少 Next 构建页面清单',
  )
  const appPathRoutesManifest = loadJsonFile(
    path.join(appRoot, APP_PATH_ROUTES_MANIFEST_PATH),
    '缺少 Next 页面路由映射清单',
  )

  return Object.entries(appPathsManifest)
    .filter(([routeKey]) => routeKey.endsWith('/page'))
    .map(([routeKey, buildPath]) => {
      const routePath = appPathRoutesManifest[routeKey] || routeKey.slice(0, -'/page'.length)
      return {
        routeKey,
        routePath,
        buildPath: path.join(appRoot, '.next', 'server', buildPath),
        matcher: createMatcher(routePath),
      }
    })
    .filter((entry) => entry.routePath !== '/_not-found' && shouldDispatchPage(entry.routePath))
    .sort((left, right) => right.matcher.score - left.matcher.score || right.routePath.length - left.routePath.length)
}

function createPageModuleDispatcher({ appRoot }) {
  const pages = loadPageManifest(appRoot)
  const moduleCache = new Map()

  function matchPage(pathname) {
    for (const page of pages) {
      const params = page.matcher.match(pathname)
      if (params) {
        return { page, params }
      }
    }
    return null
  }

  function loadPageModule(page) {
    if (!moduleCache.has(page.buildPath)) {
      ensureNextPageNodeEnvironment()
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const mod = require(page.buildPath)
      if (typeof mod?.handler !== 'function') {
        throw new Error(`无法解析页面模块 handler：${page.buildPath}`)
      }
      moduleCache.set(page.buildPath, mod)
    }
    return moduleCache.get(page.buildPath)
  }

  return {
    async tryHandle(nodeReq, nodeRes, requestUrl) {
      const matched = matchPage(requestUrl.pathname)
      if (!matched) {
        return false
      }

      const pageModule = loadPageModule(matched.page)
      applyNextPageRequestMeta({
        nodeReq,
        nodeRes,
        requestUrl,
        matched,
        appRoot,
      })
      await pageModule.handler(nodeReq, nodeRes, {
        waitUntil(promise) {
          return Promise.resolve(promise).catch((error) => {
            console.error('[desktop][page-module-dispatcher] waitUntil 失败', error)
          })
        },
      })

      if (!nodeRes.writableEnded) {
        throw new Error(`页面 ${matched.page.routeKey} 未结束响应`)
      }
      return true
    },
  }
}

module.exports = {
  createPageModuleDispatcher,
}
