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
  if (!csrfToken) throw new Error('获取 CSRF 失败：响应中缺少 csrfToken')

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

  const userId = sessionPayload?.user?.id
  if (typeof userId !== 'string' || !userId) {
    throw new Error(`登录会话校验失败：缺少用户 ID，响应=${JSON.stringify(sessionPayload)}`)
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
      description: '桌面轻任务提交回归项目',
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

async function createEpisode(cookieJar, projectId) {
  const response = await fetch(`${BASE_URL}/api/novel-promotion/${projectId}/episodes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify({
      name: '第1集',
      description: '轻任务提交验证剧集',
    }),
  })

  const payload = await ensureJsonResponse(response, '创建剧集')
  const episode = payload?.episode
  if (!episode?.id) {
    throw new Error(`创建剧集失败：${JSON.stringify(payload)}`)
  }

  return episode.id
}

function seedProjectData(input) {
  const db = new DatabaseSync(dbPath)
  const now = new Date().toISOString()
  const clipId = randomUUID()
  const storyboardId = randomUUID()
  const panelId = randomUUID()

  try {
    db.prepare(`
      INSERT INTO user_preferences (
        id, userId, customModels, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET
        customModels = excluded.customModels,
        updatedAt = excluded.updatedAt
    `).run(
      randomUUID(),
      input.userId,
      JSON.stringify([
        {
          modelId: 'banana-2',
          modelKey: 'fal::banana-2',
          name: 'banana-2',
          type: 'image',
          provider: 'fal',
          price: 0,
        },
      ]),
      now,
      now,
    )

    db.prepare(`
      UPDATE novel_promotion_projects
      SET analysisModel = ?, storyboardModel = ?
      WHERE projectId = ?
    `).run('fal::banana-2', 'fal::banana-2', input.projectId)

    db.prepare(`
      INSERT INTO novel_promotion_clips (
        id, episodeId, summary, content, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(clipId, input.episodeId, '测试片段', '测试片段内容', now, now)

    db.prepare(`
      INSERT INTO novel_promotion_storyboards (
        id, episodeId, clipId, panelCount, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(storyboardId, input.episodeId, clipId, 1, now, now)

    db.prepare(`
      INSERT INTO novel_promotion_panels (
        id, storyboardId, panelIndex, panelNumber, shotType, cameraMove, description, characters, imageUrl, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      panelId,
      storyboardId,
      0,
      1,
      '中景',
      '固定',
      '轻任务种子分镜',
      '[]',
      'images/light-task-panel-seed.jpg',
      now,
      now,
    )

    return {
      storyboardId,
      panelId,
    }
  } finally {
    db.close()
  }
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

async function verifyTaskRows(input) {
  return withDbRetry('verifyLightSubmitTaskRows', (db) => {
    const taskRows = {
      storyboardText: db.prepare('SELECT type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.storyboardTextTaskId),
      insertPanel: db.prepare('SELECT type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.insertPanelTaskId),
      voiceDesign: db.prepare('SELECT type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.voiceDesignTaskId),
      panelImage: db.prepare('SELECT type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.panelImageTaskId),
    }
    const runRows = {
      storyboardText: db.prepare('SELECT targetType, targetId, input FROM graph_runs WHERE taskId = ?').get(input.storyboardTextTaskId),
      insertPanel: db.prepare('SELECT targetType, targetId, input FROM graph_runs WHERE taskId = ?').get(input.insertPanelTaskId),
      voiceDesign: db.prepare('SELECT targetType, targetId, input FROM graph_runs WHERE taskId = ?').get(input.voiceDesignTaskId),
      panelImage: db.prepare('SELECT targetType, targetId, input FROM graph_runs WHERE taskId = ?').get(input.panelImageTaskId),
    }

    for (const [name, row] of Object.entries(taskRows)) {
      if (!row) throw new Error(`缺少 ${name} task 记录`)
    }
    for (const [name, row] of Object.entries(runRows)) {
      if (!row) throw new Error(`缺少 ${name} graph_run 记录`)
    }

    const storyboardTextPayload = parseJsonCell(runRows.storyboardText.input)
    const insertPanelPayload = parseJsonCell(runRows.insertPanel.input)
    const voiceDesignPayload = parseJsonCell(runRows.voiceDesign.input)
    const panelImagePayload = parseJsonCell(runRows.panelImage.input)

    if (taskRows.storyboardText.type !== 'regenerate_storyboard_text' || taskRows.storyboardText.targetType !== 'NovelPromotionStoryboard' || taskRows.storyboardText.targetId !== input.storyboardId) {
      throw new Error(`regenerate-storyboard-text task 不正确：${JSON.stringify(taskRows.storyboardText)}`)
    }
    if (taskRows.insertPanel.type !== 'insert_panel' || taskRows.insertPanel.targetType !== 'NovelPromotionStoryboard' || taskRows.insertPanel.targetId !== input.storyboardId) {
      throw new Error(`insert-panel task 不正确：${JSON.stringify(taskRows.insertPanel)}`)
    }
    if (taskRows.voiceDesign.type !== 'voice_design' || taskRows.voiceDesign.targetType !== 'NovelPromotionProject' || taskRows.voiceDesign.targetId !== input.projectId) {
      throw new Error(`voice-design task 不正确：${JSON.stringify(taskRows.voiceDesign)}`)
    }
    if (taskRows.panelImage.type !== 'image_panel' || taskRows.panelImage.targetType !== 'NovelPromotionPanel' || taskRows.panelImage.targetId !== input.panelId) {
      throw new Error(`regenerate-panel-image task 不正确：${JSON.stringify(taskRows.panelImage)}`)
    }

    if (!taskRows.storyboardText.dedupeKey?.includes(input.storyboardId)) {
      throw new Error(`regenerate-storyboard-text dedupeKey 不正确：${taskRows.storyboardText.dedupeKey}`)
    }
    if (taskRows.insertPanel.dedupeKey !== `insert_panel:${input.storyboardId}:${input.panelId}`) {
      throw new Error(`insert-panel dedupeKey 不正确：${taskRows.insertPanel.dedupeKey}`)
    }
    if (!taskRows.voiceDesign.dedupeKey?.startsWith('voice_design:')) {
      throw new Error(`voice-design dedupeKey 不正确：${taskRows.voiceDesign.dedupeKey}`)
    }
    if (taskRows.panelImage.dedupeKey !== `image_panel:${input.panelId}:2`) {
      throw new Error(`regenerate-panel-image dedupeKey 不正确：${taskRows.panelImage.dedupeKey}`)
    }

    if (storyboardTextPayload?.analysisModel !== 'fal::banana-2') {
      throw new Error(`regenerate-storyboard-text payload 未注入 analysisModel：${JSON.stringify(storyboardTextPayload)}`)
    }
    if (insertPanelPayload?.analysisModel !== 'fal::banana-2') {
      throw new Error(`insert-panel payload 未注入 analysisModel：${JSON.stringify(insertPanelPayload)}`)
    }
    if (!insertPanelPayload?.userInput || typeof insertPanelPayload.userInput !== 'string') {
      throw new Error(`insert-panel payload 未携带 userInput：${JSON.stringify(insertPanelPayload)}`)
    }
    if (voiceDesignPayload?.voicePrompt !== '沉稳男声' || voiceDesignPayload?.previewText !== '这是一段试听文本') {
      throw new Error(`voice-design payload 不正确：${JSON.stringify(voiceDesignPayload)}`)
    }
    if (panelImagePayload?.candidateCount !== 2 || panelImagePayload?.imageModel !== 'fal::banana-2') {
      throw new Error(`regenerate-panel-image payload 不正确：${JSON.stringify(panelImagePayload)}`)
    }
    if (panelImagePayload?.ui?.intent !== 'regenerate' || panelImagePayload?.ui?.hasOutputAtStart !== true) {
      throw new Error(`regenerate-panel-image UI 标记不正确：${JSON.stringify(panelImagePayload)}`)
    }

    return {
      storyboardTextStatus: taskRows.storyboardText.status,
      insertPanelStatus: taskRows.insertPanel.status,
      voiceDesignStatus: taskRows.voiceDesign.status,
      panelImageStatus: taskRows.panelImage.status,
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
    const username = `desktop_light_submit_${Date.now()}`
    const password = 'abc12345'
    const projectName = `轻提交回归-${Date.now()}`

    await registerUser(username, password)
    const { cookieJar, userId } = await loginUser(username, password)
    const projectId = await createProject(cookieJar, projectName)
    const episodeId = await createEpisode(cookieJar, projectId)
    const { storyboardId, panelId } = seedProjectData({ projectId, episodeId, userId })

    const storyboardTextTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/regenerate-storyboard-text`,
      { storyboardId },
      '提交 regenerate-storyboard-text',
    )
    const insertPanelTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/insert-panel`,
      { storyboardId, insertAfterPanelId: panelId },
      '提交 insert-panel',
    )
    const voiceDesignTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/voice-design`,
      {
        voicePrompt: '沉稳男声',
        previewText: '这是一段试听文本',
        preferredName: 'custom_voice_demo',
        language: 'zh',
      },
      '提交 voice-design',
    )
    const panelImageTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/regenerate-panel-image`,
      { panelId, count: 2 },
      '提交 regenerate-panel-image',
    )

    await delay(500)

    const dbResult = await verifyTaskRows({
      storyboardTextTaskId: storyboardTextTask.taskId,
      insertPanelTaskId: insertPanelTask.taskId,
      voiceDesignTaskId: voiceDesignTask.taskId,
      panelImageTaskId: panelImageTask.taskId,
      projectId,
      storyboardId,
      panelId,
    })

    console.log(JSON.stringify({
      ok: true,
      boot,
      username,
      projectId,
      episodeId,
      storyboardId,
      panelId,
      storyboardTextTaskId: storyboardTextTask.taskId,
      insertPanelTaskId: insertPanelTask.taskId,
      voiceDesignTaskId: voiceDesignTask.taskId,
      panelImageTaskId: panelImageTask.taskId,
      ...dbResult,
    }))
  } finally {
    if (!nextChild.killed) {
      nextChild.kill()
    }
  }
}

await main()


