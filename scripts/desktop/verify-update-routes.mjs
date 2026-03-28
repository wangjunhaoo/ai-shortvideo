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
    throw new Error(
      `${label}返回了无法解析的 JSON：${error instanceof Error ? error.message : String(error)}\n${text}`,
    )
  }
}

async function waitForBoot(timeoutMs) {
  const deadline = Date.now() + timeoutMs
  let lastError = 'unknown'

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/api/system/boot-id`, { redirect: 'manual' })
      if (response.ok) {
        return await response.text()
      }
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
    child.stdout.on('data', () => {})
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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: username,
      password,
    }),
  })

  await ensureJsonResponse(response, '注册')
}

async function loginUser(username, password) {
  const cookieJar = new CookieJar()

  const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`, {
    redirect: 'manual',
  })
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
    headers: {
      Cookie: cookieJar.toHeader(),
    },
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
      description: '桌面更新路由回归项目',
      mode: 'novel-promotion',
    }),
  })

  const payload = await ensureJsonResponse(response, '创建项目')
  const projectId = payload?.project?.id
  if (typeof projectId !== 'string' || !projectId) {
    throw new Error('创建项目失败：响应中缺少 project.id')
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
      name: '测试角色',
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
      name: '测试场景',
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
      description: '回归测试剧集',
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

async function createEpisodesBatch(cookieJar, projectId, episodes, options = {}) {
  const response = await fetch(`${BASE_URL}/api/novel-promotion/${projectId}/episodes/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify({
      episodes,
      clearExisting: options.clearExisting === true,
      importStatus: options.importStatus,
    }),
  })

  return ensureJsonResponse(response, '批量创建剧集')
}

function insertShot(episodeId) {
  const db = new DatabaseSync(dbPath)
  const shotId = randomUUID()
  try {
    db.prepare(`
      INSERT INTO novel_promotion_shots (
        id, episodeId, shotId, srtStart, srtEnd, srtDuration
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(shotId, episodeId, `shot-${Date.now()}`, 0, 1, 1)
  } finally {
    db.close()
  }

  return shotId
}

async function updateAppearance(cookieJar, projectId, characterId, appearanceId, newDescription) {
  const response = await fetch(`${BASE_URL}/api/novel-promotion/${projectId}/update-appearance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify({
      characterId,
      appearanceId,
      newDescription,
      descriptionIndex: 0,
    }),
  })

  await ensureJsonResponse(response, '更新角色形象描述')
}

async function updateLocation(cookieJar, projectId, locationId, newDescription) {
  const response = await fetch(`${BASE_URL}/api/novel-promotion/${projectId}/update-location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify({
      locationId,
      imageIndex: 0,
      newDescription,
    }),
  })

  await ensureJsonResponse(response, '更新场景描述')
}

async function updatePrompt(cookieJar, projectId, shotId, field, value) {
  const response = await fetch(`${BASE_URL}/api/novel-promotion/${projectId}/update-prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify({
      shotId,
      field,
      value,
    }),
  })

  await ensureJsonResponse(response, '更新镜头提示词')
}

function verifyDbRows(input) {
  const db = new DatabaseSync(dbPath)
  try {
    const appearance = db
      .prepare('SELECT description, descriptions FROM character_appearances WHERE id = ?')
      .get(input.appearanceId)
    const location = db
      .prepare('SELECT description FROM location_images WHERE locationId = ? AND imageIndex = 0')
      .get(input.locationId)
    const shot = db
      .prepare('SELECT imagePrompt FROM novel_promotion_shots WHERE id = ?')
      .get(input.shotId)
    const project = db
      .prepare(`
        SELECT npp.lastEpisodeId, npp.importStatus
        FROM novel_promotion_projects npp
        INNER JOIN projects p ON p.id = npp.projectId
        WHERE p.id = ?
      `)
      .get(input.projectId)
    const batchEpisodes = db
      .prepare(`
        SELECT id, episodeNumber, name
        FROM novel_promotion_episodes
        WHERE novelPromotionProjectId = (
          SELECT id FROM novel_promotion_projects WHERE projectId = ?
        )
        ORDER BY episodeNumber ASC
      `)
      .all(input.projectId)

    if (!appearance) {
      throw new Error('SQLite 回查失败：缺少 character_appearances 记录')
    }
    if (!location) {
      throw new Error('SQLite 回查失败：缺少 location_images 记录')
    }
    if (!shot) {
      throw new Error('SQLite 回查失败：缺少 novel_promotion_shots 记录')
    }
    if (!project) {
      throw new Error('SQLite 回查失败：缺少 novel_promotion_projects 记录')
    }

    if (appearance.description !== input.expectedAppearance) {
      throw new Error(`角色描述未写回：${JSON.stringify(appearance)}`)
    }

    const descriptions = appearance.descriptions ? JSON.parse(appearance.descriptions) : []
    if (!Array.isArray(descriptions) || descriptions[0] !== input.expectedAppearance) {
      throw new Error(`角色 descriptions 未写回：${appearance.descriptions}`)
    }

    if (location.description !== input.expectedLocation) {
      throw new Error(`场景描述未写回：${JSON.stringify(location)}`)
    }
    if (shot.imagePrompt !== input.expectedPrompt) {
      throw new Error(`镜头提示词未写回：${JSON.stringify(shot)}`)
    }
    if (project.importStatus !== input.expectedImportStatus) {
      throw new Error(`importStatus 未写回：${JSON.stringify(project)}`)
    }
    if (!Array.isArray(batchEpisodes) || batchEpisodes.length !== 1) {
      throw new Error(`批量清空后剧集数量不正确：${JSON.stringify(batchEpisodes)}`)
    }
    if (batchEpisodes[0].id !== input.episodeId || batchEpisodes[0].episodeNumber !== 1) {
      throw new Error(`剧集重建后的编号或 id 不正确：${JSON.stringify(batchEpisodes)}`)
    }
    if (project.lastEpisodeId !== input.episodeId) {
      throw new Error(`lastEpisodeId 未指向最新单集：${JSON.stringify(project)}`)
    }

    return {
      appearanceDescription: appearance.description,
      locationDescription: location.description,
      imagePrompt: shot.imagePrompt,
      importStatus: project.importStatus,
    }
  } finally {
    db.close()
  }
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
    const username = `desktop_update_verify_${Date.now()}`
    const password = 'abc12345'
    const projectName = `更新路由回归-${Date.now()}`
    const expectedAppearance = '更新后的角色描述'
    const expectedLocation = '更新后的场景描述'
    const expectedPrompt = '更新后的镜头提示词'
    const expectedImportStatus = 'cleared'

    await registerUser(username, password)
    const cookieJar = await loginUser(username, password)
    const projectId = await createProject(cookieJar, projectName)
    const { characterId, appearanceId } = await createCharacter(cookieJar, projectId)
    const { locationId } = await createLocation(cookieJar, projectId)
    const batchCreatePayload = await createEpisodesBatch(
      cookieJar,
      projectId,
      [
        { name: '批量第1集', description: '批量描述1', novelText: '批量正文1' },
        { name: '批量第2集', description: '批量描述2', novelText: '批量正文2' },
      ],
      { importStatus: 'imported' },
    )
    if (!Array.isArray(batchCreatePayload?.episodes) || batchCreatePayload.episodes.length !== 2) {
      throw new Error(`批量创建剧集失败：${JSON.stringify(batchCreatePayload)}`)
    }
    const batchClearPayload = await createEpisodesBatch(
      cookieJar,
      projectId,
      [],
      { clearExisting: true, importStatus: expectedImportStatus },
    )
    if (batchClearPayload?.message !== '已清空剧集') {
      throw new Error(`批量清空剧集失败：${JSON.stringify(batchClearPayload)}`)
    }
    const { episodeId } = await createEpisode(cookieJar, projectId)
    const shotId = insertShot(episodeId)

    await updateAppearance(cookieJar, projectId, characterId, appearanceId, expectedAppearance)
    await updateLocation(cookieJar, projectId, locationId, expectedLocation)
    await updatePrompt(cookieJar, projectId, shotId, 'imagePrompt', expectedPrompt)

    const dbResult = verifyDbRows(
      {
        projectId,
        episodeId,
        appearanceId,
        locationId,
        shotId,
        expectedAppearance,
        expectedLocation,
        expectedPrompt,
        expectedImportStatus,
      },
    )

    console.log(JSON.stringify({
      ok: true,
      boot,
      username,
      projectId,
      characterId,
      appearanceId,
      locationId,
      episodeId,
      shotId,
      ...dbResult,
    }))
  } finally {
    if (!nextChild.killed) {
      nextChild.kill()
    }
  }
}

await main()


