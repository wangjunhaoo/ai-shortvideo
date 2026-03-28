import { logError as _ulogError } from '@/lib/logging/core'
import * as fs from 'fs/promises'
import * as path from 'path'
import { resolveUploadRoot } from '@/lib/storage/utils'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './data/uploads'

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.json': 'application/json',
  '.txt': 'text/plain',
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

export async function handleLocalFileRequest(
  _request: Request,
  decodedPath: string,
) {
  try {
    const uploadRoot = resolveUploadRoot(UPLOAD_DIR)
    const filePath = path.join(uploadRoot, decodedPath)
    const normalizedPath = path.normalize(filePath)
    const uploadDirPath = path.normalize(uploadRoot)

    if (!normalizedPath.startsWith(uploadDirPath + path.sep)) {
      _ulogError(`[Files API] 路径逃逸尝试: ${decodedPath}`)
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    const buffer = await fs.readFile(filePath)
    const mimeType = getMimeType(filePath)

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error: unknown) {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: unknown }).code
      : undefined
    if (code === 'ENOENT') {
      return Response.json({ error: 'File not found' }, { status: 404 })
    }

    _ulogError('[Files API] 读取文件失败:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
