const fs = require('node:fs')
const { Readable } = require('node:stream')

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function createMatcher(routePath) {
  const segmentNames = []
  const normalized = routePath === '/' ? [] : routePath.split('/').filter(Boolean)
  const pattern = normalized
    .map((segment) => {
      if (segment.startsWith('[[...') && segment.endsWith(']]')) {
        const name = segment.slice(5, -2)
        segmentNames.push({ name, kind: 'optionalCatchAll' })
        return '(?:/(.*))?'
      }
      if (segment.startsWith('[...') && segment.endsWith(']')) {
        const name = segment.slice(4, -1)
        segmentNames.push({ name, kind: 'catchAll' })
        return '/(.+)'
      }
      if (segment.startsWith('[') && segment.endsWith(']')) {
        const name = segment.slice(1, -1)
        segmentNames.push({ name, kind: 'dynamic' })
        return '/([^/]+)'
      }
      return `/${escapeRegex(segment)}`
    })
    .join('')

  const regex = new RegExp(`^${pattern || '/'}$`)
  const score = normalized.reduce((total, segment) => {
    if (segment.startsWith('[[...')) return total + 1
    if (segment.startsWith('[...')) return total + 2
    if (segment.startsWith('[')) return total + 3
    return total + 10
  }, 0)

  return {
    regex,
    score,
    match(pathname) {
      const matched = regex.exec(pathname)
      if (!matched) return null
      /** @type {Record<string, string | string[]>} */
      const params = {}
      segmentNames.forEach((segment, index) => {
        const rawValue = matched[index + 1]
        if (typeof rawValue !== 'string') return
        if (segment.kind === 'catchAll' || segment.kind === 'optionalCatchAll') {
          params[segment.name] = rawValue.split('/').filter(Boolean).map(decodeURIComponent)
          return
        }
        params[segment.name] = decodeURIComponent(rawValue)
      })
      return params
    },
  }
}

function createHeadersFromNodeRequest(nodeReq) {
  const headers = new Headers()
  for (const [key, value] of Object.entries(nodeReq.headers || {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') headers.append(key, item)
      }
      continue
    }
    if (typeof value === 'string') {
      headers.set(key, value)
    }
  }
  return headers
}

function createWebRequest(nodeReq, requestUrl) {
  const method = (nodeReq.method || 'GET').toUpperCase()
  const init = {
    method,
    headers: createHeadersFromNodeRequest(nodeReq),
  }

  if (method !== 'GET' && method !== 'HEAD') {
    init.body = nodeReq
    init.duplex = 'half'
  }

  return new Request(requestUrl, init)
}

function applyResponseHeaders(nodeRes, response) {
  const setCookie = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : []
  if (setCookie.length > 0) {
    nodeRes.setHeader('set-cookie', setCookie)
  }

  for (const [key, value] of response.headers.entries()) {
    if (key.toLowerCase() === 'set-cookie') continue
    nodeRes.setHeader(key, value)
  }
}

async function writeWebResponse(nodeReq, nodeRes, response) {
  nodeRes.statusCode = response.status
  applyResponseHeaders(nodeRes, response)

  if (nodeReq.method === 'HEAD' || !response.body) {
    nodeRes.end()
    return
  }

  await new Promise((resolve, reject) => {
    Readable.fromWeb(response.body).pipe(nodeRes)
    nodeRes.on('finish', resolve)
    nodeRes.on('error', reject)
  })
}

function loadJsonFile(filePath, errorMessage) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${errorMessage}：${filePath}`)
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

module.exports = {
  createMatcher,
  createWebRequest,
  loadJsonFile,
  writeWebResponse,
}
