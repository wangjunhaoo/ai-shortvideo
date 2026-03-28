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
  const userId = sessionPayload?.user?.id
  if (sessionPayload?.user?.name !== username || typeof userId !== 'string' || !userId) {
    throw new Error(`登录会话校验失败：${JSON.stringify(sessionPayload)}`)
  }

  return { cookieJar, userId }
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
      description: '桌面最终重路由回归项目',
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
  const episodeId = payload?.episode?.id
  if (typeof episodeId !== 'string' || !episodeId) {
    throw new Error(`创建剧集失败：${JSON.stringify(payload)}`)
  }
  return episodeId
}

async function postJson(cookieJar, pathname, body, label) {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': 'zh-CN',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify(body),
  })
  return ensureJsonResponse(response, label)
}

function parseJsonCell(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'object') return value
  if (typeof value === 'string') return JSON.parse(value)
  return value
}

function isDatabaseLockedError(error) {
  return error instanceof Error && /database is locked/i.test(error.message)
}

async function withDbRetry(label, fn, options = {}) {
  const attempts = options.attempts ?? 10
  const intervalMs = options.intervalMs ?? 300
  let lastError = null

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let db = null
    try {
      db = new DatabaseSync(dbPath)
      db.exec(`PRAGMA busy_timeout = ${Math.max(intervalMs, 300)}`)
      return fn(db)
    } catch (error) {
      lastError = error
      if (!isDatabaseLockedError(error) || attempt === attempts) {
        throw error
      }
      await delay(intervalMs)
    } finally {
      db?.close()
    }
  }

  throw new Error(`${label}失败：${lastError instanceof Error ? lastError.message : String(lastError)}`)
}

function seedHeavyRouteData(input) {
  const db = new DatabaseSync(dbPath)
  const now = new Date().toISOString()

  const variantClipId = randomUUID()
  const variantStoryboardId = randomUUID()
  const variantInsertAfterPanelId = randomUUID()
  const variantSourcePanelId = randomUUID()

  const videoSingleClipId = randomUUID()
  const videoSingleStoryboardId = randomUUID()
  const videoSinglePanelId = randomUUID()

  const videoBatchClipId = randomUUID()
  const videoBatchStoryboardId = randomUUID()
  const videoBatchPanelAId = randomUUID()
  const videoBatchPanelBId = randomUUID()

  try {
    db.prepare(`
      UPDATE novel_promotion_projects
      SET storyboardModel = ?, videoModel = ?
      WHERE projectId = ?
    `).run('fal::banana-2', 'fal::seedance/video', input.projectId)

    db.prepare(`
      INSERT INTO novel_promotion_clips (
        id, episodeId, summary, content, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(variantClipId, input.variantEpisodeId, '变体片段', '变体片段内容', now, now)

    db.prepare(`
      INSERT INTO novel_promotion_storyboards (
        id, episodeId, clipId, panelCount, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(variantStoryboardId, input.variantEpisodeId, variantClipId, 2, now, now)

    db.prepare(`
      INSERT INTO novel_promotion_panels (
        id, storyboardId, panelIndex, panelNumber, shotType, cameraMove, description, videoPrompt, location, characters, duration, imageUrl, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      variantInsertAfterPanelId,
      variantStoryboardId,
      0,
      1,
      '中景',
      '固定',
      '原始首格分镜',
      '首格镜头提示',
      '旧城区',
      JSON.stringify(['角色甲']),
      3,
      'images/panel-variant-insert-after.jpg',
      now,
      now,
    )

    db.prepare(`
      INSERT INTO novel_promotion_panels (
        id, storyboardId, panelIndex, panelNumber, shotType, cameraMove, description, videoPrompt, location, characters, duration, imageUrl, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      variantSourcePanelId,
      variantStoryboardId,
      1,
      2,
      '特写',
      '推进',
      '原始源分镜',
      '源分镜镜头提示',
      '旧城区',
      JSON.stringify(['角色乙']),
      4,
      'images/panel-variant-source.jpg',
      now,
      now,
    )

    db.prepare(`
      INSERT INTO novel_promotion_clips (
        id, episodeId, summary, content, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(videoSingleClipId, input.videoSingleEpisodeId, '单视频片段', '单视频片段内容', now, now)

    db.prepare(`
      INSERT INTO novel_promotion_storyboards (
        id, episodeId, clipId, panelCount, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(videoSingleStoryboardId, input.videoSingleEpisodeId, videoSingleClipId, 1, now, now)

    db.prepare(`
      INSERT INTO novel_promotion_panels (
        id, storyboardId, panelIndex, panelNumber, shotType, cameraMove, description, videoPrompt, location, characters, duration, imageUrl, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      videoSinglePanelId,
      videoSingleStoryboardId,
      0,
      1,
      '远景',
      '跟拍',
      '单视频分镜',
      '单视频镜头提示',
      '广场',
      JSON.stringify([]),
      5,
      'images/video-single-panel.jpg',
      now,
      now,
    )

    db.prepare(`
      INSERT INTO novel_promotion_clips (
        id, episodeId, summary, content, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(videoBatchClipId, input.videoBatchEpisodeId, '批量视频片段', '批量视频片段内容', now, now)

    db.prepare(`
      INSERT INTO novel_promotion_storyboards (
        id, episodeId, clipId, panelCount, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(videoBatchStoryboardId, input.videoBatchEpisodeId, videoBatchClipId, 2, now, now)

    db.prepare(`
      INSERT INTO novel_promotion_panels (
        id, storyboardId, panelIndex, panelNumber, shotType, cameraMove, description, videoPrompt, location, characters, duration, imageUrl, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      videoBatchPanelAId,
      videoBatchStoryboardId,
      0,
      1,
      '中景',
      '固定',
      '批量视频分镜A',
      '批量视频镜头提示A',
      '街道',
      JSON.stringify([]),
      4,
      'images/video-batch-panel-a.jpg',
      now,
      now,
    )

    db.prepare(`
      INSERT INTO novel_promotion_panels (
        id, storyboardId, panelIndex, panelNumber, shotType, cameraMove, description, videoPrompt, location, characters, duration, imageUrl, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      videoBatchPanelBId,
      videoBatchStoryboardId,
      1,
      2,
      '近景',
      '摇镜',
      '批量视频分镜B',
      '批量视频镜头提示B',
      '街道',
      JSON.stringify([]),
      4,
      'images/video-batch-panel-b.jpg',
      now,
      now,
    )

    return {
      variantStoryboardId,
      variantInsertAfterPanelId,
      variantSourcePanelId,
      videoSingleStoryboardId,
      videoSinglePanelId,
      videoBatchStoryboardId,
      videoBatchPanelAId,
      videoBatchPanelBId,
    }
  } finally {
    db.close()
  }
}

function buildMarkerContent() {
  const block = (title, content) => `${title}\n${content}\n${content}`
  return [
    block('第1集 初见', '林舟在雨夜追查失踪案线索，沿着旧城巷口反复确认目击者证词，逐步锁定真正的交易地点。'),
    block('第2集 对抗', '对手提前布下诱饵，林舟与搭档分头试探，在废弃仓库与码头之间切换，试图找出幕后指挥者。'),
    block('第3集 终局', '最终对峙时证据链完整闭环，角色关系被彻底揭开，案件真相和个人选择同时抵达收束节点。'),
  ].join('\n\n')
}

async function verifyFinalRows(input) {
  return withDbRetry('verifyFinalHeavyRoutes', (db) => {
    const createdPanel = db.prepare(`
      SELECT id, storyboardId, panelIndex, panelNumber, description, videoPrompt
      FROM novel_promotion_panels
      WHERE id = ?
    `).get(input.panelVariantPanelId)
    if (!createdPanel) {
      throw new Error('panel-variant 未创建新 panel')
    }
    if (createdPanel.storyboardId !== input.variantStoryboardId || createdPanel.panelIndex !== 1 || createdPanel.panelNumber !== 2) {
      throw new Error(`panel-variant 新 panel 索引不正确：${JSON.stringify(createdPanel)}`)
    }

    const variantStoryboard = db.prepare(`
      SELECT panelCount
      FROM novel_promotion_storyboards
      WHERE id = ?
    `).get(input.variantStoryboardId)
    if (!variantStoryboard || Number(variantStoryboard.panelCount) !== 3) {
      throw new Error(`panel-variant storyboard panelCount 不正确：${JSON.stringify(variantStoryboard)}`)
    }

    const panelVariantTask = db.prepare(`
      SELECT type, targetType, targetId, status
      FROM tasks
      WHERE id = ?
    `).get(input.panelVariantTaskId)
    if (!panelVariantTask || panelVariantTask.type !== 'panel_variant' || panelVariantTask.targetType !== 'NovelPromotionPanel' || panelVariantTask.targetId !== input.panelVariantPanelId) {
      throw new Error(`panel-variant task 记录不正确：${JSON.stringify(panelVariantTask)}`)
    }

    const panelVariantRun = db.prepare(`
      SELECT input
      FROM graph_runs
      WHERE taskId = ?
    `).get(input.panelVariantTaskId)
    const panelVariantPayload = parseJsonCell(panelVariantRun?.input)
    if (panelVariantPayload?.newPanelId !== input.panelVariantPanelId) {
      throw new Error(`panel-variant graph_run.input.newPanelId 不正确：${JSON.stringify(panelVariantPayload)}`)
    }

    const singleVideoTask = db.prepare(`
      SELECT type, targetType, targetId, status
      FROM tasks
      WHERE id = ?
    `).get(input.singleVideoTaskId)
    if (!singleVideoTask || singleVideoTask.type !== 'video_panel' || singleVideoTask.targetType !== 'NovelPromotionPanel' || singleVideoTask.targetId !== input.videoSinglePanelId) {
      throw new Error(`generate-video 单任务记录不正确：${JSON.stringify(singleVideoTask)}`)
    }
    const singleVideoRun = db.prepare(`
      SELECT input
      FROM graph_runs
      WHERE taskId = ?
    `).get(input.singleVideoTaskId)
    const singleVideoPayload = parseJsonCell(singleVideoRun?.input)
    if (singleVideoPayload?.videoModel !== 'fal::seedance/video') {
      throw new Error(`generate-video 单任务 payload 不正确：${JSON.stringify(singleVideoPayload)}`)
    }

    const batchTaskRows = input.batchVideoTaskIds.map((taskId) => db.prepare(`
      SELECT id, type, targetType, targetId, status
      FROM tasks
      WHERE id = ?
    `).get(taskId))
    if (batchTaskRows.some((row) => !row)) {
      throw new Error(`generate-video 批量任务缺失：${JSON.stringify(batchTaskRows)}`)
    }
    const batchTargetIds = new Set(batchTaskRows.map((row) => row.targetId))
    const expectedBatchIds = new Set([input.videoBatchPanelAId, input.videoBatchPanelBId])
    if (
      batchTaskRows.some((row) => row.type !== 'video_panel' || row.targetType !== 'NovelPromotionPanel')
      || batchTargetIds.size !== expectedBatchIds.size
      || Array.from(expectedBatchIds).some((panelId) => !batchTargetIds.has(panelId))
    ) {
      throw new Error(`generate-video 批量任务目标不正确：${JSON.stringify(batchTaskRows)}`)
    }

    for (const taskId of input.batchVideoTaskIds) {
      const batchRun = db.prepare('SELECT input FROM graph_runs WHERE taskId = ?').get(taskId)
      const batchPayload = parseJsonCell(batchRun?.input)
      if (batchPayload?.videoModel !== 'fal::seedance/video') {
        throw new Error(`generate-video 批量 payload 不正确：${JSON.stringify(batchPayload)}`)
      }
    }

    return {
      panelVariantStatus: panelVariantTask.status,
      singleVideoStatus: singleVideoTask.status,
      batchVideoStatuses: batchTaskRows.map((row) => row.status),
    }
  })
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
    const username = `desktop_final_heavy_${Date.now()}`
    const password = 'abc12345'
    const projectName = `最终重路由回归-${Date.now()}`

    await registerUser(username, password)
    const { cookieJar } = await loginUser(username, password)
    const projectId = await createProject(cookieJar, projectName)
    const variantEpisodeId = await createEpisode(cookieJar, projectId, '变体剧集')
    const videoSingleEpisodeId = await createEpisode(cookieJar, projectId, '单视频剧集')
    const videoBatchEpisodeId = await createEpisode(cookieJar, projectId, '批量视频剧集')

    const seeded = seedHeavyRouteData({
      projectId,
      variantEpisodeId,
      videoSingleEpisodeId,
      videoBatchEpisodeId,
    })

    const splitByMarkers = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/episodes/split-by-markers`,
      { content: buildMarkerContent() },
      '提交 split-by-markers',
    )
    if (splitByMarkers?.success !== true || splitByMarkers?.method !== 'markers' || !Array.isArray(splitByMarkers?.episodes) || splitByMarkers.episodes.length < 2) {
      throw new Error(`split-by-markers 返回不正确：${JSON.stringify(splitByMarkers)}`)
    }

    const panelVariant = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/panel-variant`,
      {
        locale: 'zh',
        storyboardId: seeded.variantStoryboardId,
        insertAfterPanelId: seeded.variantInsertAfterPanelId,
        sourcePanelId: seeded.variantSourcePanelId,
        variant: {
          shot_type: '全景',
          camera_move: '拉远',
          description: '新增变体分镜',
          video_prompt: '新增变体镜头提示',
          location: '新城区',
          characters: ['角色甲', '角色乙'],
        },
      },
      '提交 panel-variant',
    )
    if (!panelVariant?.async || typeof panelVariant?.taskId !== 'string' || typeof panelVariant?.panelId !== 'string') {
      throw new Error(`panel-variant 返回不正确：${JSON.stringify(panelVariant)}`)
    }

    const singleVideo = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/generate-video`,
      {
        locale: 'zh',
        storyboardId: seeded.videoSingleStoryboardId,
        panelIndex: 0,
        videoModel: 'fal::seedance/video',
      },
      '提交 generate-video(single)',
    )
    if (!singleVideo?.async || typeof singleVideo?.taskId !== 'string') {
      throw new Error(`generate-video 单任务返回不正确：${JSON.stringify(singleVideo)}`)
    }

    const batchVideo = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/generate-video`,
      {
        locale: 'zh',
        episodeId: videoBatchEpisodeId,
        all: true,
        videoModel: 'fal::seedance/video',
      },
      '提交 generate-video(batch)',
    )
    if (batchVideo?.total !== 2 || !Array.isArray(batchVideo?.tasks) || batchVideo.tasks.length !== 2) {
      throw new Error(`generate-video 批量返回不正确：${JSON.stringify(batchVideo)}`)
    }

    const batchVideoTaskIds = batchVideo.tasks.map((task) => task?.taskId).filter((taskId) => typeof taskId === 'string')
    if (batchVideoTaskIds.length !== 2) {
      throw new Error(`generate-video 批量 taskIds 不正确：${JSON.stringify(batchVideo)}`)
    }

    await delay(500)

    const dbResult = await verifyFinalRows({
      panelVariantTaskId: panelVariant.taskId,
      panelVariantPanelId: panelVariant.panelId,
      variantStoryboardId: seeded.variantStoryboardId,
      singleVideoTaskId: singleVideo.taskId,
      videoSinglePanelId: seeded.videoSinglePanelId,
      batchVideoTaskIds,
      videoBatchPanelAId: seeded.videoBatchPanelAId,
      videoBatchPanelBId: seeded.videoBatchPanelBId,
    })

    console.log(JSON.stringify({
      ok: true,
      boot,
      username,
      projectId,
      variantEpisodeId,
      videoSingleEpisodeId,
      videoBatchEpisodeId,
      splitEpisodeCount: splitByMarkers.episodes.length,
      panelVariantTaskId: panelVariant.taskId,
      panelVariantPanelId: panelVariant.panelId,
      singleVideoTaskId: singleVideo.taskId,
      batchVideoTaskIds,
      ...dbResult,
    }))
  } finally {
    if (!nextChild.killed) {
      nextChild.kill()
    }
  }
}

await main()


