import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { DatabaseSync } from 'node:sqlite'

const REPO_ROOT = process.cwd()
const BASE_URL = 'http://127.0.0.1:13000'
const APPDATA = process.env.APPDATA

if (!APPDATA) {
  throw new Error('缺少 APPDATA 环境变量')
}

const runtimeConfigPath = path.join(APPDATA, 'Electron', 'runtime-config.json')
const dbPath = path.join(APPDATA, 'Electron', 'data', 'waoowaoo.db')
const uploadDir = path.join(APPDATA, 'Electron', 'uploads')
const logDir = path.join(APPDATA, 'Electron', 'logs')
const nextLogPath = path.join(REPO_ROOT, '.tmp-next-start.log')

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie()
  }

  const raw = headers.get('set-cookie')
  if (!raw) return []
  return raw.split(/,(?=\s*[^;,=\s]+=[^;]+)/g)
}

class CookieJar {
  constructor() {
    this.cookies = new Map()
  }

  addFromHeaders(headers) {
    for (const cookie of getSetCookies(headers)) {
      const firstPart = cookie.split(';')[0]?.trim()
      if (!firstPart) continue
      const separatorIndex = firstPart.indexOf('=')
      if (separatorIndex <= 0) continue
      const name = firstPart.slice(0, separatorIndex).trim()
      const value = firstPart.slice(separatorIndex + 1).trim()
      if (!name) continue
      this.cookies.set(name, value)
    }
  }

  toHeader() {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')
  }
}

function buildDesktopEnv(runtimeConfig) {
  return {
    ...process.env,
    NODE_ENV: 'production',
    DATABASE_URL: `file:${dbPath.replace(/\\/g, '/')}`,
    STORAGE_TYPE: 'local',
    UPLOAD_DIR: uploadDir,
    DESKTOP_LOCAL_TASKS: 'true',
    APP_BASE_URL: BASE_URL,
    INTERNAL_APP_URL: BASE_URL,
    AUTH_SESSION_SECRET: runtimeConfig.authSessionSecret,
    CRON_SECRET: runtimeConfig.cronSecret,
    INTERNAL_TASK_TOKEN: runtimeConfig.internalTaskToken,
    API_ENCRYPTION_KEY: runtimeConfig.apiEncryptionKey,
    LOG_UNIFIED_ENABLED: 'true',
    LOG_LEVEL: 'INFO',
    LOG_FORMAT: 'json',
    LOG_DEBUG_ENABLED: 'false',
    LOG_AUDIT_ENABLED: 'true',
    LOG_SERVICE: 'waoowaoo-desktop',
    LOG_DIR: logDir,
    BILLING_MODE: 'OFF',
    LLM_STREAM_EPHEMERAL_ENABLED: 'true',
  }
}

async function ensureJsonResponse(response, label) {
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`${label}失败：HTTP ${response.status}\n${text}`)
  }

  try {
    return text ? JSON.parse(text) : {}
  } catch (error) {
    throw new Error(`${label}返回了无法解析的 JSON：${error instanceof Error ? error.message : String(error)}\n${text}`)
  }
}

async function waitForBoot(timeoutMs) {
  const deadline = Date.now() + timeoutMs
  let lastError = 'unknown'

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/api/system/boot-id`, { redirect: 'manual' })
      if (response.ok) return await response.text()
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }

    await delay(2_000)
  }

  throw new Error(`桌面 Next 服务未在 ${timeoutMs}ms 内启动：${lastError}`)
}

async function runNode(env, args, label) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: REPO_ROOT,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })

    let stderr = ''
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined)
        return
      }
      reject(new Error(`${label}失败，退出码 ${code}\n${stderr}`))
    })
  })
}

function startNextServer(env) {
  const child = spawn(
    process.execPath,
    [path.join('node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-H', '127.0.0.1', '-p', '13000'],
    {
      cwd: REPO_ROOT,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    },
  )

  const sink = async (source, chunk) => {
    await fs.appendFile(nextLogPath, `[${new Date().toISOString()}] [${source}] ${chunk.toString()}`)
  }

  child.stdout?.on('data', (chunk) => {
    void sink('stdout', chunk)
  })
  child.stderr?.on('data', (chunk) => {
    void sink('stderr', chunk)
  })

  return child
}

async function registerUser(username, password) {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: username, password }),
  })

  await ensureJsonResponse(response, '注册')
}

async function loginUser(username, password) {
  const cookieJar = new CookieJar()

  const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`, { redirect: 'manual' })
  cookieJar.addFromHeaders(csrfResponse.headers)
  const csrfPayload = await ensureJsonResponse(csrfResponse, '获取 CSRF')
  const csrfToken = typeof csrfPayload.csrfToken === 'string' ? csrfPayload.csrfToken : ''
  if (!csrfToken) {
    throw new Error('获取 CSRF 失败：响应中缺少 csrfToken')
  }

  const body = new URLSearchParams({
    username,
    password,
    redirect: 'false',
    csrfToken,
    callbackUrl: `${BASE_URL}/zh/auth/signin`,
    json: 'true',
  })

  const loginResponse = await fetch(`${BASE_URL}/api/auth/login?json=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookieJar.toHeader(),
    },
    body,
    redirect: 'manual',
  })
  cookieJar.addFromHeaders(loginResponse.headers)
  await ensureJsonResponse(loginResponse, '登录')

  const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { Cookie: cookieJar.toHeader() },
  })
  const sessionPayload = await ensureJsonResponse(sessionResponse, '获取会话')
  if (sessionPayload?.user?.name !== username) {
    throw new Error(`登录会话校验失败：当前用户不是 ${username}`)
  }

  return cookieJar
}

async function createProject(cookieJar, projectName) {
  const response = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify({
      name: projectName,
      description: '桌面下载路由回归项目',
      mode: 'novel-promotion',
    }),
  })

  const payload = await ensureJsonResponse(response, '创建项目')
  const projectId = payload?.project?.id
  if (typeof projectId !== 'string' || !projectId) {
    throw new Error(`创建项目失败：${JSON.stringify(payload)}`)
  }
  return projectId
}

async function createEpisode(cookieJar, projectId, name) {
  const response = await fetch(`${BASE_URL}/api/novel-promotion/${projectId}/episodes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify({
      name,
      description: `${name} 描述`,
    }),
  })

  const payload = await ensureJsonResponse(response, '创建剧集')
  const episode = payload?.episode
  if (!episode?.id) {
    throw new Error(`创建剧集失败：${JSON.stringify(payload)}`)
  }

  return episode.id
}

async function ensureSeedFiles() {
  const files = {
    image1: 'images/download-route-panel-1.jpg',
    image2: 'images/download-route-panel-2.jpg',
    video1: 'videos/download-route-panel-1.mp4',
    video1LipSync: 'videos/download-route-panel-1-lipsync.mp4',
    video2: 'videos/download-route-panel-2.mp4',
    voice1: 'voices/download-route-001.mp3',
    voice2: 'voices/download-route-002.wav',
  }

  for (const relativePath of Object.values(files)) {
    const fullPath = path.join(uploadDir, relativePath)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, Buffer.from(`seed:${relativePath}`))
  }

  return files
}

function seedDownloadData(input) {
  const db = new DatabaseSync(dbPath)
  const now = new Date().toISOString()
  const clipAId = randomUUID()
  const clipBId = randomUUID()
  const storyboardAId = randomUUID()
  const storyboardBId = randomUUID()
  const panelAId = randomUUID()
  const panelBId = randomUUID()

  try {
    db.prepare(`
      INSERT INTO novel_promotion_clips (
        id, episodeId, summary, content, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(clipAId, input.episodeId, '片段 A', '片段 A 内容', now, now)

    db.prepare(`
      INSERT INTO novel_promotion_clips (
        id, episodeId, summary, content, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(clipBId, input.episodeId, '片段 B', '片段 B 内容', now, now)

    db.prepare(`
      INSERT INTO novel_promotion_storyboards (
        id, episodeId, clipId, panelCount, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(storyboardAId, input.episodeId, clipAId, 1, now, now)

    db.prepare(`
      INSERT INTO novel_promotion_storyboards (
        id, episodeId, clipId, panelCount, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(storyboardBId, input.episodeId, clipBId, 1, now, now)

    db.prepare(`
      INSERT INTO novel_promotion_panels (
        id, storyboardId, panelIndex, panelNumber, shotType, cameraMove, description, characters, imageUrl, videoUrl, lipSyncVideoUrl, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      panelAId,
      storyboardAId,
      0,
      1,
      '中景',
      '固定',
      '镜头一',
      '[]',
      input.files.image1,
      input.files.video1,
      input.files.video1LipSync,
      now,
      now,
    )

    db.prepare(`
      INSERT INTO novel_promotion_panels (
        id, storyboardId, panelIndex, panelNumber, shotType, cameraMove, description, characters, imageUrl, videoUrl, lipSyncVideoUrl, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      panelBId,
      storyboardBId,
      0,
      1,
      '特写',
      '推进',
      '镜头二',
      '[]',
      input.files.image2,
      input.files.video2,
      null,
      now,
      now,
    )

    db.prepare(`
      INSERT INTO novel_promotion_voice_lines (
        id, episodeId, lineIndex, speaker, content, audioUrl, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), input.episodeId, 1, '角色甲', '第一句台词', input.files.voice1, now, now)

    db.prepare(`
      INSERT INTO novel_promotion_voice_lines (
        id, episodeId, lineIndex, speaker, content, audioUrl, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), input.episodeId, 2, '角色乙', '第二句台词', input.files.voice2, now, now)

    return {
      storyboardAId,
      storyboardBId,
      panelAId,
      panelBId,
    }
  } finally {
    db.close()
  }
}

async function assertZipResponse(response, label, expectedFileName) {
  if (!response.ok) {
    throw new Error(`${label}失败：HTTP ${response.status}\n${await response.text()}`)
  }

  const contentType = response.headers.get('content-type') || ''
  const disposition = response.headers.get('content-disposition') || ''
  const buffer = Buffer.from(await response.arrayBuffer())

  if (!contentType.includes('application/zip')) {
    throw new Error(`${label}返回的 content-type 不正确：${contentType}`)
  }
  if (!disposition.includes(expectedFileName)) {
    throw new Error(`${label}返回的 content-disposition 不正确：${disposition}`)
  }
  if (buffer.byteLength <= 20) {
    throw new Error(`${label}返回的 ZIP 内容过小：${buffer.byteLength}`)
  }

  return buffer.byteLength
}

async function main() {
  const runtimeConfig = JSON.parse(await fs.readFile(runtimeConfigPath, 'utf8'))
  const env = buildDesktopEnv(runtimeConfig)

  await fs.writeFile(nextLogPath, '', 'utf8')
  await runNode(
    env,
    [path.join('node_modules', 'prisma', 'build', 'index.js'), 'db', 'push', '--schema', path.join('prisma', 'schema.sqlite.prisma'), '--skip-generate'],
    'prisma db push',
  )

  const nextChild = startNextServer(env)

  try {
    const boot = await waitForBoot(90_000)
    const username = `desktop_download_${Date.now()}`
    const password = 'abc12345'
    const projectName = `download-route-${Date.now()}`
    const foreignProjectName = `download-route-foreign-${Date.now()}`

    await registerUser(username, password)
    const cookieJar = await loginUser(username, password)
    const projectId = await createProject(cookieJar, projectName)
    const foreignProjectId = await createProject(cookieJar, foreignProjectName)
    const episodeId = await createEpisode(cookieJar, projectId, '第1集')
    const foreignEpisodeId = await createEpisode(cookieJar, foreignProjectId, '外部剧集')

    const files = await ensureSeedFiles()
    const seeded = seedDownloadData({ episodeId, files })

    const imageDownload = await fetch(
      `${BASE_URL}/api/novel-promotion/${projectId}/download-images?episodeId=${encodeURIComponent(episodeId)}`,
      { headers: { Cookie: cookieJar.toHeader() } },
    )
    const imagesZipBytes = await assertZipResponse(imageDownload, '下载图片', '_images.zip')

    const videoDownload = await fetch(`${BASE_URL}/api/novel-promotion/${projectId}/download-videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieJar.toHeader(),
      },
      body: JSON.stringify({
        episodeId,
        panelPreferences: {
          [`${seeded.storyboardAId}-0`]: false,
          [`${seeded.storyboardBId}-0`]: true,
        },
      }),
    })
    const videosZipBytes = await assertZipResponse(videoDownload, '下载视频', '_videos.zip')

    const voiceDownload = await fetch(
      `${BASE_URL}/api/novel-promotion/${projectId}/download-voices?episodeId=${encodeURIComponent(episodeId)}`,
      { headers: { Cookie: cookieJar.toHeader() } },
    )
    const voicesZipBytes = await assertZipResponse(voiceDownload, '下载配音', '_voices.zip')

    const videoUrlsResponse = await fetch(`${BASE_URL}/api/novel-promotion/${projectId}/video-urls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieJar.toHeader(),
      },
      body: JSON.stringify({
        episodeId,
        panelPreferences: {
          [`${seeded.storyboardAId}-0`]: false,
          [`${seeded.storyboardBId}-0`]: true,
        },
      }),
    })
    const videoUrlsPayload = await ensureJsonResponse(videoUrlsResponse, '获取视频下载链接')

    if (videoUrlsPayload?.projectName !== projectName) {
      throw new Error(`video-urls 返回的项目名不正确：${JSON.stringify(videoUrlsPayload)}`)
    }
    if (!Array.isArray(videoUrlsPayload?.videos) || videoUrlsPayload.videos.length !== 2) {
      throw new Error(`video-urls 返回数量不正确：${JSON.stringify(videoUrlsPayload)}`)
    }
    if (!videoUrlsPayload.videos[0]?.videoUrl?.includes(encodeURIComponent(files.video1))) {
      throw new Error(`video-urls 未按偏好选择原始视频：${JSON.stringify(videoUrlsPayload.videos)}`)
    }
    if (!videoUrlsPayload.videos[1]?.videoUrl?.includes(encodeURIComponent(files.video2))) {
      throw new Error(`video-urls 第二个视频链接不正确：${JSON.stringify(videoUrlsPayload.videos)}`)
    }

    const foreignEpisodeResponse = await fetch(`${BASE_URL}/api/novel-promotion/${projectId}/video-urls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieJar.toHeader(),
      },
      body: JSON.stringify({ episodeId: foreignEpisodeId }),
    })
    if (foreignEpisodeResponse.status !== 404) {
      throw new Error(`跨项目剧集边界未生效：HTTP ${foreignEpisodeResponse.status}`)
    }

    console.log(JSON.stringify({
      ok: true,
      boot,
      username,
      projectId,
      episodeId,
      foreignProjectId,
      foreignEpisodeId,
      imagesZipBytes,
      videosZipBytes,
      voicesZipBytes,
      videoUrlCount: videoUrlsPayload.videos.length,
    }))
  } finally {
    if (!nextChild.killed) {
      nextChild.kill()
    }
  }
}

await main()


