const fs = require('node:fs')
const path = require('node:path')

const MIME_TYPES = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function resolveSafeFile(rootDir, relativePath) {
  const normalized = relativePath.replace(/^\/+/, '')
  const resolvedRoot = path.resolve(rootDir)
  const resolvedPath = path.resolve(resolvedRoot, normalized)
  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    return null
  }
  if (!fs.existsSync(resolvedPath)) return null
  if (!fs.statSync(resolvedPath).isFile()) return null
  return resolvedPath
}

function resolveStaticAsset(appRoot, pathname) {
  if (pathname.startsWith('/_next/static/')) {
    return resolveSafeFile(path.join(appRoot, '.next', 'static'), pathname.slice('/_next/static/'.length))
  }
  return resolveSafeFile(path.join(appRoot, 'public'), pathname)
}

function sendRedirect(nodeRes, location) {
  nodeRes.statusCode = 307
  nodeRes.setHeader('location', location)
  nodeRes.end()
}

function sendFile(nodeReq, nodeRes, filePath, cacheControl) {
  const extension = path.extname(filePath).toLowerCase()
  nodeRes.statusCode = 200
  nodeRes.setHeader('content-type', MIME_TYPES[extension] || 'application/octet-stream')
  if (cacheControl) {
    nodeRes.setHeader('cache-control', cacheControl)
  }
  if (nodeReq.method === 'HEAD') {
    nodeRes.end()
    return
  }

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
    stream.on('error', reject)
    nodeRes.on('error', reject)
    nodeRes.on('finish', resolve)
    stream.pipe(nodeRes)
  })
}

function createStaticAssetDispatcher({ appRoot }) {
  return {
    async tryHandle(nodeReq, nodeRes, requestUrl) {
      const { pathname, searchParams } = requestUrl

      if (pathname === '/_next/image') {
        const imageUrl = searchParams.get('url')
        if (typeof imageUrl !== 'string' || imageUrl.length === 0) {
          nodeRes.statusCode = 400
          nodeRes.setHeader('content-type', 'application/json; charset=utf-8')
          nodeRes.end(JSON.stringify({
            success: false,
            error: {
              code: 'IMAGE_URL_REQUIRED',
              message: '缺少 image url 参数',
            },
          }))
          return true
        }
        sendRedirect(nodeRes, imageUrl)
        return true
      }

      const assetFile = resolveStaticAsset(appRoot, pathname)
      if (!assetFile) {
        return false
      }

      const cacheControl = pathname.startsWith('/_next/static/')
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=0, must-revalidate'
      await sendFile(nodeReq, nodeRes, assetFile, cacheControl)
      return true
    },
  }
}

module.exports = {
  createStaticAssetDispatcher,
}
