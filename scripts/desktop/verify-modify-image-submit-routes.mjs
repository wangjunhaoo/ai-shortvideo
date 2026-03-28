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
      description: '桌面图片任务提交回归项目',
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

async function createCharacter(cookieJar, projectId) {
  const response = await fetch(`${BASE_URL}/api/novel-promotion/${projectId}/character`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify({
      name: '图片修改角色',
      description: '初始角色描述',
    }),
  })

  const payload = await ensureJsonResponse(response, '创建角色')
  const character = payload?.character
  const appearanceId = character?.appearances?.[0]?.id
  if (!character?.id || !appearanceId) {
    throw new Error(`创建角色失败：${JSON.stringify(payload)}`)
  }

  return {
    characterId: character.id,
    appearanceId,
  }
}

async function createLocation(cookieJar, projectId) {
  const response = await fetch(`${BASE_URL}/api/novel-promotion/${projectId}/location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify({
      name: '图片修改场景',
      description: '初始场景描述',
    }),
  })

  const payload = await ensureJsonResponse(response, '创建场景')
  const location = payload?.location
  if (!location?.id) {
    throw new Error(`创建场景失败：${JSON.stringify(payload)}`)
  }

  return {
    locationId: location.id,
  }
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
      description: '图片提交验证剧集',
    }),
  })

  const payload = await ensureJsonResponse(response, '创建剧集')
  const episode = payload?.episode
  if (!episode?.id) {
    throw new Error(`创建剧集失败：${JSON.stringify(payload)}`)
  }

  return {
    episodeId: episode.id,
  }
}

function seedProjectData(input) {
  const db = new DatabaseSync(dbPath)
  const now = new Date().toISOString()
  const locationImageId = randomUUID()
  const clipId = randomUUID()
  const storyboardId = randomUUID()
  const panelId = randomUUID()

  try {
    db.prepare(`
      UPDATE novel_promotion_projects
      SET characterModel = ?, locationModel = ?, editModel = ?
      WHERE projectId = ?
    `).run('fal::banana-2', 'fal::banana-2', 'fal::banana-2', input.projectId)

    db.prepare(`
      UPDATE character_appearances
      SET imageUrl = ?, imageUrls = ?, selectedIndex = ?, description = ?, descriptions = ?
      WHERE id = ?
    `).run(
      'images/modify-character-seed.jpg',
      JSON.stringify(['images/modify-character-seed.jpg']),
      0,
      '角色种子描述',
      JSON.stringify(['角色种子描述']),
      input.appearanceId,
    )

    const existingLocationImage = db
      .prepare('SELECT id FROM location_images WHERE locationId = ? ORDER BY imageIndex ASC LIMIT 1')
      .get(input.locationId)

    if (existingLocationImage?.id) {
      db.prepare(`
        UPDATE location_images
        SET imageUrl = ?, description = ?, isSelected = ?
        WHERE id = ?
      `).run(
        'images/modify-location-seed.jpg',
        '场景种子描述',
        1,
        existingLocationImage.id,
      )
      db.prepare('UPDATE novel_promotion_locations SET selectedImageId = ? WHERE id = ?')
        .run(existingLocationImage.id, input.locationId)
    } else {
      db.prepare(`
        INSERT INTO location_images (
          id, locationId, imageIndex, imageUrl, description, isSelected, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        locationImageId,
        input.locationId,
        0,
        'images/modify-location-seed.jpg',
        '场景种子描述',
        1,
        now,
        now,
      )
      db.prepare('UPDATE novel_promotion_locations SET selectedImageId = ? WHERE id = ?')
        .run(locationImageId, input.locationId)
    }

    db.prepare(`
      INSERT INTO novel_promotion_clips (
        id, episodeId, summary, content, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      clipId,
      input.episodeId,
      '测试分镜组',
      '测试分镜组内容',
      now,
      now,
    )

    db.prepare(`
      INSERT INTO novel_promotion_storyboards (
        id, episodeId, clipId, panelCount, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      storyboardId,
      input.episodeId,
      clipId,
      1,
      now,
      now,
    )

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
      '分镜种子描述',
      '[]',
      'images/modify-panel-seed.jpg',
      now,
      now,
    )

    const currentLocationImage = db
      .prepare('SELECT id FROM location_images WHERE locationId = ? ORDER BY imageIndex ASC LIMIT 1')
      .get(input.locationId)

    return {
      locationImageId: currentLocationImage?.id || locationImageId,
      storyboardId,
      panelId,
    }
  } finally {
    db.close()
  }
}

async function postJson(cookieJar, pathName, body, label) {
  const response = await fetch(`${BASE_URL}${pathName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': 'zh-CN',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify({
      locale: 'zh',
      ...body,
    }),
  })

  return await ensureJsonResponse(response, label)
}

function parseJsonCell(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'object') return value
  if (typeof value === 'string') return JSON.parse(value)
  return value
}

function unwrapAuditReasons(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (item && typeof item === 'object' ? item.reason : null))
    .filter((item) => typeof item === 'string')
}

function isDatabaseLockedError(error) {
  if (!(error instanceof Error)) return false
  return /database is locked/i.test(error.message)
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
  return withDbRetry('verifyTaskRows', (db) => {
    const taskRows = {
      character: db.prepare('SELECT id, type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.characterTaskId),
      location: db.prepare('SELECT id, type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.locationTaskId),
      storyboard: db.prepare('SELECT id, type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.storyboardTaskId),
    }
    const runRows = {
      character: db.prepare('SELECT id, taskId, targetType, targetId, input FROM graph_runs WHERE taskId = ?').get(input.characterTaskId),
      location: db.prepare('SELECT id, taskId, targetType, targetId, input FROM graph_runs WHERE taskId = ?').get(input.locationTaskId),
      storyboard: db.prepare('SELECT id, taskId, targetType, targetId, input FROM graph_runs WHERE taskId = ?').get(input.storyboardTaskId),
    }

    for (const [name, row] of Object.entries(taskRows)) {
      if (!row) {
        throw new Error(`SQLite 回查失败：缺少 ${name} 任务记录`)
      }
    }
    for (const [name, row] of Object.entries(runRows)) {
      if (!row) {
        throw new Error(`SQLite 回查失败：缺少 ${name} graph_run 记录`)
      }
    }

    const characterPayload = parseJsonCell(runRows.character.input)
    const locationPayload = parseJsonCell(runRows.location.input)
    const storyboardPayload = parseJsonCell(runRows.storyboard.input)

    if (taskRows.character.type !== 'modify_asset_image' || taskRows.character.targetType !== 'CharacterAppearance' || taskRows.character.targetId !== input.appearanceId) {
      throw new Error(`角色任务目标不正确：${JSON.stringify(taskRows.character)}`)
    }
    if (taskRows.location.type !== 'modify_asset_image' || taskRows.location.targetType !== 'LocationImage' || taskRows.location.targetId !== input.locationImageId) {
      throw new Error(`场景任务目标不正确：${JSON.stringify(taskRows.location)}`)
    }
    if (taskRows.storyboard.type !== 'modify_asset_image' || taskRows.storyboard.targetType !== 'NovelPromotionPanel' || taskRows.storyboard.targetId !== input.panelId) {
      throw new Error(`分镜任务目标不正确：${JSON.stringify(taskRows.storyboard)}`)
    }

    if (runRows.character.targetType !== 'CharacterAppearance' || runRows.character.targetId !== input.appearanceId) {
      throw new Error(`角色 graph_run 目标不正确：${JSON.stringify(runRows.character)}`)
    }
    if (runRows.location.targetType !== 'LocationImage' || runRows.location.targetId !== input.locationImageId) {
      throw new Error(`场景 graph_run 目标不正确：${JSON.stringify(runRows.location)}`)
    }
    if (runRows.storyboard.targetType !== 'NovelPromotionPanel' || runRows.storyboard.targetId !== input.panelId) {
      throw new Error(`分镜 graph_run 目标不正确：${JSON.stringify(runRows.storyboard)}`)
    }

    if (!taskRows.character.dedupeKey?.includes(input.appearanceId)) {
      throw new Error(`角色任务 dedupeKey 不正确：${taskRows.character.dedupeKey}`)
    }
    if (!taskRows.location.dedupeKey?.includes(input.locationImageId)) {
      throw new Error(`场景任务 dedupeKey 不正确：${taskRows.location.dedupeKey}`)
    }
    if (taskRows.storyboard.dedupeKey !== `modify_storyboard_image:${input.panelId}`) {
      throw new Error(`分镜任务 dedupeKey 不正确：${taskRows.storyboard.dedupeKey}`)
    }

    if (characterPayload?.imageModel !== 'fal::banana-2' || locationPayload?.imageModel !== 'fal::banana-2' || storyboardPayload?.imageModel !== 'fal::banana-2') {
      throw new Error('任务 payload 未注入 editModel')
    }

    if (characterPayload?.ui?.intent !== 'modify' || locationPayload?.ui?.intent !== 'modify' || storyboardPayload?.ui?.intent !== 'modify') {
      throw new Error('任务 UI intent 不正确')
    }
    if (characterPayload?.ui?.hasOutputAtStart !== true || locationPayload?.ui?.hasOutputAtStart !== true || storyboardPayload?.ui?.hasOutputAtStart !== true) {
      throw new Error('任务 hasOutputAtStart 未保持为 true')
    }

    if (JSON.stringify(characterPayload?.extraImageUrls) !== JSON.stringify(input.expectedCharacterExtraImageUrls)) {
      throw new Error(`角色 extraImageUrls 归一化失败：${JSON.stringify(characterPayload?.extraImageUrls)}`)
    }
    if (JSON.stringify(locationPayload?.extraImageUrls) !== JSON.stringify(input.expectedLocationExtraImageUrls)) {
      throw new Error(`场景 extraImageUrls 归一化失败：${JSON.stringify(locationPayload?.extraImageUrls)}`)
    }
    if (JSON.stringify(storyboardPayload?.extraImageUrls) !== JSON.stringify(input.expectedStoryboardExtraImageUrls)) {
      throw new Error(`分镜 extraImageUrls 归一化失败：${JSON.stringify(storyboardPayload?.extraImageUrls)}`)
    }

    const storyboardSelectedAssets = Array.isArray(storyboardPayload?.selectedAssets) ? storyboardPayload.selectedAssets : []
    if (storyboardSelectedAssets[0]?.imageUrl !== input.expectedStoryboardSelectedAssetUrl) {
      throw new Error(`分镜 selectedAssets 归一化失败：${JSON.stringify(storyboardSelectedAssets)}`)
    }

    const characterAuditReasons = unwrapAuditReasons(characterPayload?.meta?.outboundImageInputAudit?.extraImageUrls)
    const locationAuditReasons = unwrapAuditReasons(locationPayload?.meta?.outboundImageInputAudit?.extraImageUrls)
    const storyboardAuditReasons = unwrapAuditReasons(storyboardPayload?.meta?.outboundImageInputAudit?.extraImageUrls)
    const storyboardSelectedAuditReasons = unwrapAuditReasons(storyboardPayload?.meta?.outboundImageInputAudit?.selectedAssets)

    if (!characterAuditReasons.includes('next_image_unwrapped')) {
      throw new Error(`角色任务未记录 next_image_unwrapped：${JSON.stringify(characterPayload?.meta)}`)
    }
    if (!locationAuditReasons.includes('next_image_unwrapped')) {
      throw new Error(`场景任务未记录 next_image_unwrapped：${JSON.stringify(locationPayload?.meta)}`)
    }
    if (!storyboardAuditReasons.includes('next_image_unwrapped')) {
      throw new Error(`分镜任务未记录 extraImageUrls 的 next_image_unwrapped：${JSON.stringify(storyboardPayload?.meta)}`)
    }
    if (!storyboardSelectedAuditReasons.includes('next_image_unwrapped')) {
      throw new Error(`分镜任务未记录 selectedAssets 的 next_image_unwrapped：${JSON.stringify(storyboardPayload?.meta)}`)
    }

    return {
      characterStatus: taskRows.character.status,
      locationStatus: taskRows.location.status,
      storyboardStatus: taskRows.storyboard.status,
      characterDedupeKey: taskRows.character.dedupeKey,
      locationDedupeKey: taskRows.location.dedupeKey,
      storyboardDedupeKey: taskRows.storyboard.dedupeKey,
    }
  })
}

async function verifyRegenerateTaskRows(input) {
  return withDbRetry('verifyRegenerateTaskRows', (db) => {
    const taskRows = {
      characterGroup: db.prepare('SELECT id, type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.characterGroupTaskId),
      locationGroup: db.prepare('SELECT id, type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.locationGroupTaskId),
      characterSingle: db.prepare('SELECT id, type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.characterSingleTaskId),
      locationSingle: db.prepare('SELECT id, type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.locationSingleTaskId),
    }
    const runRows = {
      characterGroup: db.prepare('SELECT id, taskId, targetType, targetId, input FROM graph_runs WHERE taskId = ?').get(input.characterGroupTaskId),
      locationGroup: db.prepare('SELECT id, taskId, targetType, targetId, input FROM graph_runs WHERE taskId = ?').get(input.locationGroupTaskId),
      characterSingle: db.prepare('SELECT id, taskId, targetType, targetId, input FROM graph_runs WHERE taskId = ?').get(input.characterSingleTaskId),
      locationSingle: db.prepare('SELECT id, taskId, targetType, targetId, input FROM graph_runs WHERE taskId = ?').get(input.locationSingleTaskId),
    }

    for (const [name, row] of Object.entries(taskRows)) {
      if (!row) {
        throw new Error(`SQLite 回查失败：缺少 ${name} 任务记录`)
      }
    }
    for (const [name, row] of Object.entries(runRows)) {
      if (!row) {
        throw new Error(`SQLite 回查失败：缺少 ${name} graph_run 记录`)
      }
    }

    const characterGroupPayload = parseJsonCell(runRows.characterGroup.input)
    const locationGroupPayload = parseJsonCell(runRows.locationGroup.input)
    const characterSinglePayload = parseJsonCell(runRows.characterSingle.input)
    const locationSinglePayload = parseJsonCell(runRows.locationSingle.input)

    if (taskRows.characterGroup.type !== 'regenerate_group' || taskRows.characterGroup.targetType !== 'CharacterAppearance' || taskRows.characterGroup.targetId !== input.appearanceId) {
      throw new Error(`角色组重生任务不正确：${JSON.stringify(taskRows.characterGroup)}`)
    }
    if (taskRows.locationGroup.type !== 'regenerate_group' || taskRows.locationGroup.targetType !== 'LocationImage' || taskRows.locationGroup.targetId !== input.locationId) {
      throw new Error(`场景组重生任务不正确：${JSON.stringify(taskRows.locationGroup)}`)
    }
    if (taskRows.characterSingle.type !== 'image_character' || taskRows.characterSingle.targetType !== 'CharacterAppearance' || taskRows.characterSingle.targetId !== input.appearanceId) {
      throw new Error(`角色单图重生任务不正确：${JSON.stringify(taskRows.characterSingle)}`)
    }
    if (taskRows.locationSingle.type !== 'image_location' || taskRows.locationSingle.targetType !== 'LocationImage' || taskRows.locationSingle.targetId !== input.locationId) {
      throw new Error(`场景单图重生任务不正确：${JSON.stringify(taskRows.locationSingle)}`)
    }

    if (characterGroupPayload?.count !== input.expectedGroupCount || locationGroupPayload?.count !== input.expectedGroupCount) {
      throw new Error('组重生任务 count 未按预期写入')
    }
    if (characterSinglePayload?.imageIndex !== 0 || locationSinglePayload?.imageIndex !== 0) {
      throw new Error('单图重生任务 imageIndex 未按预期写入')
    }

    for (const payload of [characterGroupPayload, locationGroupPayload, characterSinglePayload, locationSinglePayload]) {
      if (payload?.imageModel !== 'fal::banana-2') {
        throw new Error('重生任务 payload 未注入模型配置')
      }
      if (payload?.ui?.intent !== 'regenerate' || payload?.ui?.hasOutputAtStart !== true) {
        throw new Error('重生任务 UI 标记不正确')
      }
    }

    const locationImageCountRow = db
      .prepare('SELECT COUNT(*) AS count FROM location_images WHERE locationId = ?')
      .get(input.locationId)
    if (!locationImageCountRow || Number(locationImageCountRow.count) < input.expectedGroupCount) {
      throw new Error(`场景图片槽位未扩容：${JSON.stringify(locationImageCountRow)}`)
    }

    return {
      characterGroupStatus: taskRows.characterGroup.status,
      locationGroupStatus: taskRows.locationGroup.status,
      characterSingleStatus: taskRows.characterSingle.status,
      locationSingleStatus: taskRows.locationSingle.status,
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
    const username = `desktop_modify_submit_${Date.now()}`
    const password = 'abc12345'
    const projectName = `图片提交回归-${Date.now()}`

    await registerUser(username, password)
    const cookieJar = await loginUser(username, password)
    const projectId = await createProject(cookieJar, projectName)
    const { characterId, appearanceId } = await createCharacter(cookieJar, projectId)
    const { locationId } = await createLocation(cookieJar, projectId)
    const { episodeId } = await createEpisode(cookieJar, projectId)
    const { locationImageId, storyboardId, panelId } = seedProjectData({
      projectId,
      appearanceId,
      locationId,
      episodeId,
    })

    const characterExtraImageUrls = [
      'images/character-ref-a.jpg',
      ' images/character-ref-a.jpg ',
      '/_next/image?url=%2Fapi%2Ffiles%2Fimages%2Fcharacter-ref-b.jpg&w=640&q=75',
    ]
    const locationExtraImageUrls = [
      'images/location-ref-a.jpg',
      '/_next/image?url=%2Fapi%2Ffiles%2Fimages%2Flocation-ref-b.jpg&w=640&q=75',
    ]
    const storyboardExtraImageUrls = [
      'images/storyboard-ref-a.jpg',
      '/_next/image?url=%2Fapi%2Ffiles%2Fimages%2Fstoryboard-ref-b.jpg&w=640&q=75',
    ]

    const characterTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/modify-asset-image`,
      {
        type: 'character',
        characterId,
        appearanceId,
        imageIndex: 0,
        modifyPrompt: '增强角色质感',
        extraImageUrls: characterExtraImageUrls,
      },
      '提交角色图片修改任务',
    )

    const locationTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/modify-asset-image`,
      {
        type: 'location',
        locationId,
        locationImageId,
        imageIndex: 0,
        modifyPrompt: '增强场景层次',
        extraImageUrls: locationExtraImageUrls,
      },
      '提交场景图片修改任务',
    )

    const storyboardTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/modify-storyboard-image`,
      {
        storyboardId,
        panelIndex: 0,
        modifyPrompt: '提升镜头对比与质感',
        extraImageUrls: storyboardExtraImageUrls,
        selectedAssets: [
          {
            id: 'selected-character-1',
            name: '角色参考',
            type: 'character',
            imageUrl: '/_next/image?url=%2Fapi%2Ffiles%2Fimages%2Fselected-character.jpg&w=640&q=75',
          },
          {
            id: 'selected-location-1',
            name: '场景参考',
            type: 'location',
            imageUrl: 'images/selected-location.jpg',
          },
        ],
      },
      '提交分镜图片修改任务',
    )

    const characterTaskId = characterTask?.taskId
    const locationTaskId = locationTask?.taskId
    const storyboardTaskId = storyboardTask?.taskId

    if (!characterTask?.async || typeof characterTaskId !== 'string') {
      throw new Error(`角色任务提交结果不正确：${JSON.stringify(characterTask)}`)
    }
    if (!locationTask?.async || typeof locationTaskId !== 'string') {
      throw new Error(`场景任务提交结果不正确：${JSON.stringify(locationTask)}`)
    }
    if (!storyboardTask?.async || typeof storyboardTaskId !== 'string') {
      throw new Error(`分镜任务提交结果不正确：${JSON.stringify(storyboardTask)}`)
    }

    const characterGroupTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/regenerate-group`,
      {
        type: 'character',
        id: characterId,
        appearanceId,
        count: 2,
      },
      '提交角色组重生任务',
    )
    const locationGroupTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/regenerate-group`,
      {
        type: 'location',
        id: locationId,
        count: 2,
      },
      '提交场景组重生任务',
    )
    const characterSingleTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/regenerate-single-image`,
      {
        type: 'character',
        id: characterId,
        appearanceId,
        imageIndex: 0,
      },
      '提交角色单图重生任务',
    )
    const locationSingleTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/regenerate-single-image`,
      {
        type: 'location',
        id: locationId,
        imageIndex: 0,
      },
      '提交场景单图重生任务',
    )

    const characterGroupTaskId = characterGroupTask?.taskId
    const locationGroupTaskId = locationGroupTask?.taskId
    const characterSingleTaskId = characterSingleTask?.taskId
    const locationSingleTaskId = locationSingleTask?.taskId

    if (!characterGroupTask?.async || typeof characterGroupTaskId !== 'string') {
      throw new Error(`角色组重生任务提交结果不正确：${JSON.stringify(characterGroupTask)}`)
    }
    if (!locationGroupTask?.async || typeof locationGroupTaskId !== 'string') {
      throw new Error(`场景组重生任务提交结果不正确：${JSON.stringify(locationGroupTask)}`)
    }
    if (!characterSingleTask?.async || typeof characterSingleTaskId !== 'string') {
      throw new Error(`角色单图重生任务提交结果不正确：${JSON.stringify(characterSingleTask)}`)
    }
    if (!locationSingleTask?.async || typeof locationSingleTaskId !== 'string') {
      throw new Error(`场景单图重生任务提交结果不正确：${JSON.stringify(locationSingleTask)}`)
    }

    await delay(500)

    const dbResult = await verifyTaskRows({
      characterTaskId,
      locationTaskId,
      storyboardTaskId,
      appearanceId,
      locationImageId,
      panelId,
      expectedCharacterExtraImageUrls: ['images/character-ref-a.jpg', '/api/files/images/character-ref-b.jpg'],
      expectedLocationExtraImageUrls: ['images/location-ref-a.jpg', '/api/files/images/location-ref-b.jpg'],
      expectedStoryboardExtraImageUrls: ['images/storyboard-ref-a.jpg', '/api/files/images/storyboard-ref-b.jpg'],
      expectedStoryboardSelectedAssetUrl: '/api/files/images/selected-character.jpg',
    })
    const regenerateDbResult = await verifyRegenerateTaskRows({
      characterGroupTaskId,
      locationGroupTaskId,
      characterSingleTaskId,
      locationSingleTaskId,
      appearanceId,
      locationId,
      expectedGroupCount: 2,
    })

    console.log(JSON.stringify({
      ok: true,
      boot,
      username,
      projectId,
      characterId,
      appearanceId,
      locationId,
      locationImageId,
      storyboardId,
      panelId,
      characterTaskId,
      locationTaskId,
      storyboardTaskId,
      characterGroupTaskId,
      locationGroupTaskId,
      characterSingleTaskId,
      locationSingleTaskId,
      ...dbResult,
      ...regenerateDbResult,
    }))
  } finally {
    if (!nextChild.killed) {
      nextChild.kill()
    }
  }
}

await main()


