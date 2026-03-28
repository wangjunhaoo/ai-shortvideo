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
    throw new Error(`登录会话校验失败：缺少 user.id，响应=${JSON.stringify(sessionPayload)}`)
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
      description: '桌面生成任务回归项目',
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
      name: '旁白',
      description: '旁白角色',
    }),
  })
  const payload = await ensureJsonResponse(response, '创建角色')
  const character = payload?.character
  const appearanceId = character?.appearances?.[0]?.id
  if (!character?.id || !appearanceId) {
    throw new Error(`创建角色失败：${JSON.stringify(payload)}`)
  }
  return { characterId: character.id, appearanceId }
}

async function createLocation(cookieJar, projectId) {
  const response = await fetch(`${BASE_URL}/api/novel-promotion/${projectId}/location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify({
      name: '生成场景',
      description: '生成场景描述',
    }),
  })
  const payload = await ensureJsonResponse(response, '创建场景')
  const location = payload?.location
  if (!location?.id) {
    throw new Error(`创建场景失败：${JSON.stringify(payload)}`)
  }
  return { locationId: location.id }
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

function seedGenerationData(input) {
  const db = new DatabaseSync(dbPath)
  const now = new Date().toISOString()
  const clipId = randomUUID()
  const storyboardId = randomUUID()
  const panelId = randomUUID()
  const lineId = randomUUID()
  const allLineAId = randomUUID()
  const allLineBId = randomUUID()

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
          modelId: 'audio-model',
          modelKey: 'fal::audio-model',
          name: 'audio-model',
          type: 'audio',
          provider: 'fal',
          price: 0,
        },
      ]),
      now,
      now,
    )

    db.prepare(`
      UPDATE user_preferences
      SET lipSyncModel = ?, updatedAt = ?
      WHERE userId = ?
    `).run('fal::fal-ai/kling-video/lipsync/audio-to-video', now, input.userId)

    db.prepare(`
      UPDATE novel_promotion_projects
      SET characterModel = ?, locationModel = ?, audioModel = ?
      WHERE projectId = ?
    `).run('fal::banana-2', 'fal::banana-2', 'fal::audio-model', input.projectId)

    db.prepare(`
      UPDATE novel_promotion_characters
      SET customVoiceUrl = ?
      WHERE id = ?
    `).run('voice/ref-narrator.wav', input.characterId)

    db.prepare(`
      INSERT INTO novel_promotion_clips (
        id, episodeId, summary, content, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(clipId, input.episodeId, '生成任务片段', '生成任务片段内容', now, now)

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
      '生成任务分镜',
      '[]',
      'images/generation-panel-seed.jpg',
      now,
      now,
    )

    db.prepare(`
      INSERT INTO novel_promotion_voice_lines (
        id, episodeId, lineIndex, speaker, content, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(lineId, input.episodeId, 1, '旁白', '单条语音生成文本', now, now)

    db.prepare(`
      INSERT INTO novel_promotion_voice_lines (
        id, episodeId, lineIndex, speaker, content, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(allLineAId, input.episodeAllId, 1, '旁白', '批量语音生成文本A', now, now)

    db.prepare(`
      INSERT INTO novel_promotion_voice_lines (
        id, episodeId, lineIndex, speaker, content, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(allLineBId, input.episodeAllId, 2, '旁白', '批量语音生成文本B', now, now)

    return {
      storyboardId,
      panelId,
      lineId,
      allLineIds: [allLineAId, allLineBId],
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

async function verifyRows(input) {
  return withDbRetry('verifyGenerationTaskRows', (db) => {
    const taskRows = {
      character: db.prepare('SELECT type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.characterTaskId),
      characterWrapper: db.prepare('SELECT type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.characterWrapperTaskId),
      location: db.prepare('SELECT type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.locationTaskId),
      lipSync: db.prepare('SELECT type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.lipSyncTaskId),
      voiceSingle: db.prepare('SELECT type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.voiceSingleTaskId),
      voiceAllA: db.prepare('SELECT type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.voiceAllTaskIds[0]),
      voiceAllB: db.prepare('SELECT type, targetType, targetId, dedupeKey, status FROM tasks WHERE id = ?').get(input.voiceAllTaskIds[1]),
    }
    const runRows = {
      character: db.prepare('SELECT input FROM graph_runs WHERE taskId = ?').get(input.characterTaskId),
      characterWrapper: db.prepare('SELECT input FROM graph_runs WHERE taskId = ?').get(input.characterWrapperTaskId),
      location: db.prepare('SELECT input FROM graph_runs WHERE taskId = ?').get(input.locationTaskId),
      lipSync: db.prepare('SELECT input FROM graph_runs WHERE taskId = ?').get(input.lipSyncTaskId),
      voiceSingle: db.prepare('SELECT input FROM graph_runs WHERE taskId = ?').get(input.voiceSingleTaskId),
      voiceAllA: db.prepare('SELECT input FROM graph_runs WHERE taskId = ?').get(input.voiceAllTaskIds[0]),
      voiceAllB: db.prepare('SELECT input FROM graph_runs WHERE taskId = ?').get(input.voiceAllTaskIds[1]),
    }

    for (const [name, row] of Object.entries(taskRows)) {
      if (!row) throw new Error(`缺少 ${name} task 记录`)
    }
    for (const [name, row] of Object.entries(runRows)) {
      if (!row) throw new Error(`缺少 ${name} graph_run 记录`)
    }

    const characterPayload = parseJsonCell(runRows.character.input)
    const characterWrapperPayload = parseJsonCell(runRows.characterWrapper.input)
    const locationPayload = parseJsonCell(runRows.location.input)
    const lipSyncPayload = parseJsonCell(runRows.lipSync.input)
    const voiceSinglePayload = parseJsonCell(runRows.voiceSingle.input)
    const voiceAllPayloadA = parseJsonCell(runRows.voiceAllA.input)
    const voiceAllPayloadB = parseJsonCell(runRows.voiceAllB.input)

    if (taskRows.character.type !== 'image_character' || taskRows.character.targetType !== 'CharacterAppearance' || taskRows.character.targetId !== input.appearanceId) {
      throw new Error(`generate-image(character) task 不正确：${JSON.stringify(taskRows.character)}`)
    }
    if (taskRows.characterWrapper.type !== 'image_character' || taskRows.characterWrapper.targetId !== input.appearanceId) {
      throw new Error(`generate-character-image task 不正确：${JSON.stringify(taskRows.characterWrapper)}`)
    }
    if (taskRows.location.type !== 'image_location' || taskRows.location.targetType !== 'LocationImage' || taskRows.location.targetId !== input.locationId) {
      throw new Error(`generate-image(location) task 不正确：${JSON.stringify(taskRows.location)}`)
    }
    if (taskRows.lipSync.type !== 'lip_sync' || taskRows.lipSync.targetType !== 'NovelPromotionPanel' || taskRows.lipSync.targetId !== input.panelId) {
      throw new Error(`lip-sync task 不正确：${JSON.stringify(taskRows.lipSync)}`)
    }
    for (const voiceRow of [taskRows.voiceSingle, taskRows.voiceAllA, taskRows.voiceAllB]) {
      if (voiceRow.type !== 'voice_line' || voiceRow.targetType !== 'NovelPromotionVoiceLine') {
        throw new Error(`voice-generate task 不正确：${JSON.stringify(voiceRow)}`)
      }
    }

    if (characterPayload?.count !== 2 || characterPayload?.imageModel !== 'fal::banana-2') {
      throw new Error(`generate-image(character) payload 不正确：${JSON.stringify(characterPayload)}`)
    }
    if (characterWrapperPayload?.count !== 3 || characterWrapperPayload?.appearanceId !== input.appearanceId || characterWrapperPayload?.artStyle !== 'realistic') {
      throw new Error(`generate-character-image payload 不正确：${JSON.stringify(characterWrapperPayload)}`)
    }
    if (locationPayload?.count !== 2 || locationPayload?.imageModel !== 'fal::banana-2') {
      throw new Error(`generate-image(location) payload 不正确：${JSON.stringify(locationPayload)}`)
    }
    if (lipSyncPayload?.lipSyncModel !== 'fal::fal-ai/kling-video/lipsync/audio-to-video' || lipSyncPayload?.voiceLineId !== input.lineId) {
      throw new Error(`lip-sync payload 不正确：${JSON.stringify(lipSyncPayload)}`)
    }
    for (const payload of [voiceSinglePayload, voiceAllPayloadA, voiceAllPayloadB]) {
      if (payload?.audioModel !== 'fal::audio-model' || typeof payload?.maxSeconds !== 'number' || payload.maxSeconds <= 0) {
        throw new Error(`voice-generate payload 不正确：${JSON.stringify(payload)}`)
      }
    }

    const locationImageCountRow = db.prepare('SELECT COUNT(*) AS count FROM location_images WHERE locationId = ?').get(input.locationId)
    if (!locationImageCountRow || Number(locationImageCountRow.count) < 2) {
      throw new Error(`location_images 槽位未按预期扩容：${JSON.stringify(locationImageCountRow)}`)
    }

    return {
      characterStatus: taskRows.character.status,
      characterWrapperStatus: taskRows.characterWrapper.status,
      locationStatus: taskRows.location.status,
      lipSyncStatus: taskRows.lipSync.status,
      voiceSingleStatus: taskRows.voiceSingle.status,
      voiceAllAStatus: taskRows.voiceAllA.status,
      voiceAllBStatus: taskRows.voiceAllB.status,
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
    const username = `desktop_generation_${Date.now()}`
    const password = 'abc12345'
    const projectName = `生成任务回归-${Date.now()}`

    await registerUser(username, password)
    const { cookieJar, userId } = await loginUser(username, password)
    const projectId = await createProject(cookieJar, projectName)
    const { characterId, appearanceId } = await createCharacter(cookieJar, projectId)
    const { locationId } = await createLocation(cookieJar, projectId)
    const episodeId = await createEpisode(cookieJar, projectId, '第1集')
    const episodeAllId = await createEpisode(cookieJar, projectId, '第2集')
    const { storyboardId, panelId, lineId, allLineIds } = seedGenerationData({
      userId,
      projectId,
      characterId,
      episodeId,
      episodeAllId,
    })

    const characterTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/generate-image`,
      {
        type: 'character',
        id: characterId,
        appearanceId,
        count: 2,
        artStyle: 'realistic',
      },
      '提交 generate-image(character)',
    )
    const characterWrapperTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/generate-character-image`,
      {
        characterId,
        count: 3,
        artStyle: 'realistic',
      },
      '提交 generate-character-image',
    )
    const locationTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/generate-image`,
      {
        type: 'location',
        id: locationId,
        count: 2,
      },
      '提交 generate-image(location)',
    )
    const lipSyncTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/lip-sync`,
      {
        storyboardId,
        panelIndex: 0,
        voiceLineId: lineId,
      },
      '提交 lip-sync',
    )
    const voiceSingleTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/voice-generate`,
      {
        episodeId,
        lineId,
        audioModel: 'fal::audio-model',
      },
      '提交 voice-generate(single)',
    )
    const voiceAllTask = await postJson(
      cookieJar,
      `/api/novel-promotion/${projectId}/voice-generate`,
      {
        episodeId: episodeAllId,
        all: true,
        audioModel: 'fal::audio-model',
      },
      '提交 voice-generate(all)',
    )

    await delay(500)

    const dbResult = await verifyRows({
      characterTaskId: characterTask.taskId,
      characterWrapperTaskId: characterWrapperTask.taskId,
      locationTaskId: locationTask.taskId,
      lipSyncTaskId: lipSyncTask.taskId,
      voiceSingleTaskId: voiceSingleTask.taskId,
      voiceAllTaskIds: voiceAllTask.taskIds,
      appearanceId,
      locationId,
      panelId,
      lineId,
    })

    console.log(JSON.stringify({
      ok: true,
      boot,
      username,
      projectId,
      characterId,
      appearanceId,
      locationId,
      episodeId,
      episodeAllId,
      storyboardId,
      panelId,
      lineId,
      characterTaskId: characterTask.taskId,
      characterWrapperTaskId: characterWrapperTask.taskId,
      locationTaskId: locationTask.taskId,
      lipSyncTaskId: lipSyncTask.taskId,
      voiceSingleTaskId: voiceSingleTask.taskId,
      voiceAllTaskIds: voiceAllTask.taskIds,
      ...dbResult,
    }))
  } finally {
    if (!nextChild.killed) {
      nextChild.kill()
    }
  }
}

await main()


