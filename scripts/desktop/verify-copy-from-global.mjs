import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { randomUUID } from 'node:crypto'
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
    return Array.from(this.cookies.entries()).map(([name, value]) => `${name}=${value}`).join('; ')
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
    await delay(2000)
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

  child.stdout?.on('data', (chunk) => void sink('stdout', chunk))
  child.stderr?.on('data', (chunk) => void sink('stderr', chunk))
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
  if (!csrfToken) throw new Error('缺少 csrfToken')

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
    throw new Error(`登录会话校验失败：${JSON.stringify(sessionPayload)}`)
  }
  return cookieJar
}

async function createProject(cookieJar, name) {
  const response = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify({ name, description: 'copy-from-global verify', mode: 'novel-promotion' }),
  })
  const payload = await ensureJsonResponse(response, '创建项目')
  const projectId = payload?.project?.id
  if (!projectId) throw new Error(`创建项目失败：${JSON.stringify(payload)}`)
  return projectId
}

async function createCharacter(cookieJar, projectId) {
  const response = await fetch(`${BASE_URL}/api/novel-promotion/${projectId}/character`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify({ name: '项目角色', description: '项目角色描述' }),
  })
  const payload = await ensureJsonResponse(response, '创建项目角色')
  const character = payload?.character
  const appearanceId = character?.appearances?.[0]?.id
  if (!character?.id || !appearanceId) throw new Error(`创建角色失败：${JSON.stringify(payload)}`)
  return { characterId: character.id, appearanceId }
}

async function createLocation(cookieJar, projectId) {
  const response = await fetch(`${BASE_URL}/api/novel-promotion/${projectId}/location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify({ name: '项目场景', description: '项目场景描述' }),
  })
  const payload = await ensureJsonResponse(response, '创建项目场景')
  const location = payload?.location
  if (!location?.id) throw new Error(`创建场景失败：${JSON.stringify(payload)}`)
  return { locationId: location.id }
}

function createTestImageFile(label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <rect width="256" height="256" fill="#f97316"/>
      <circle cx="128" cy="128" r="72" fill="#111827" opacity="0.18"/>
      <text x="128" y="140" text-anchor="middle" font-size="26" fill="#ffffff">${label}</text>
    </svg>
  `.trim()
  return new File([svg], `${label}.svg`, { type: 'image/svg+xml' })
}
async function uploadAssetImage(cookieJar, projectId, params) {
  const formData = new FormData()
  formData.set('file', createTestImageFile(params.labelText))
  formData.set('type', params.type)
  formData.set('id', params.id)
  formData.set('labelText', params.labelText)
  if (params.appearanceId) formData.set('appearanceId', params.appearanceId)
  if (params.imageIndex !== undefined) formData.set('imageIndex', String(params.imageIndex))

  const response = await fetch(`${BASE_URL}/api/novel-promotion/${projectId}/upload-asset-image`, {
    method: 'POST',
    headers: { Cookie: cookieJar.toHeader() },
    body: formData,
  })
  return ensureJsonResponse(response, '上传资产图片')
}

function seedGlobalAssets(userId, keys) {
  const now = new Date().toISOString()
  const db = new DatabaseSync(dbPath)
  const globalCharacterId = randomUUID()
  const globalAppearanceId = randomUUID()
  const globalLocationId = randomUUID()
  const globalLocationImageId = randomUUID()
  const globalVoiceId = randomUUID()

  try {
    db.prepare(`
      INSERT INTO global_characters (
        id, userId, name, voiceId, voiceType, customVoiceUrl, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(globalCharacterId, userId, '全局角色', 'char-copy-voice', 'qwen-designed', 'char-copy-preview.wav', now, now)

    db.prepare(`
      INSERT INTO global_character_appearances (
        id, characterId, appearanceIndex, changeReason, description, descriptions,
        imageUrl, imageUrls, selectedIndex, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      globalAppearanceId,
      globalCharacterId,
      0,
      '默认形象',
      '全局角色描述',
      JSON.stringify(['全局角色描述']),
      keys.characterImageKey,
      JSON.stringify([keys.characterImageKey]),
      0,
      now,
      now,
    )

    db.prepare(`
      INSERT INTO global_locations (
        id, userId, name, summary, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(globalLocationId, userId, '全局场景', '全局场景摘要', now, now)

    db.prepare(`
      INSERT INTO global_location_images (
        id, locationId, imageIndex, description, imageUrl, isSelected, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      globalLocationImageId,
      globalLocationId,
      0,
      '全局场景描述',
      keys.locationImageKey,
      1,
      now,
      now,
    )

    db.prepare(`
      INSERT INTO global_voices (
        id, userId, name, voiceId, voiceType, customVoiceUrl, language, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(globalVoiceId, userId, '全局音色', 'voice-copy-final', 'custom', 'voice-copy-preview.wav', 'zh', now, now)
  } finally {
    db.close()
  }

  return { globalCharacterId, globalLocationId, globalVoiceId }
}

async function copyFromGlobal(cookieJar, projectId, type, targetId, globalAssetId) {
  const response = await fetch(`${BASE_URL}/api/novel-promotion/${projectId}/copy-from-global`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify({ type, targetId, globalAssetId }),
  })
  return ensureJsonResponse(response, `从全局复制${type}`)
}

function verifyCopyDbRows(input) {
  const db = new DatabaseSync(dbPath)
  try {
    const character = db.prepare(`
      SELECT sourceGlobalCharacterId, profileConfirmed, voiceId, voiceType, customVoiceUrl
      FROM novel_promotion_characters WHERE id = ?
    `).get(input.characterId)

    const appearances = db.prepare(`
      SELECT appearanceIndex, description, imageUrl, selectedIndex
      FROM character_appearances WHERE characterId = ?
      ORDER BY appearanceIndex ASC
    `).all(input.characterId)

    const location = db.prepare(`
      SELECT sourceGlobalLocationId, summary, selectedImageId
      FROM novel_promotion_locations WHERE id = ?
    `).get(input.locationId)

    const images = db.prepare(`
      SELECT id, imageIndex, description, imageUrl, isSelected
      FROM location_images WHERE locationId = ?
      ORDER BY imageIndex ASC
    `).all(input.locationId)

    if (!character || !location) {
      throw new Error('SQLite 回查失败：缺少项目资产记录')
    }
    if (!Array.isArray(appearances) || appearances.length !== 1) {
      throw new Error(`角色形象复制结果异常：${JSON.stringify(appearances)}`)
    }
    if (!Array.isArray(images) || images.length !== 1) {
      throw new Error(`场景图片复制结果异常：${JSON.stringify(images)}`)
    }
    if (character.sourceGlobalCharacterId !== input.globalCharacterId || character.profileConfirmed !== 1) {
      throw new Error(`角色来源或确认状态异常：${JSON.stringify(character)}`)
    }
    if (character.voiceId !== 'voice-copy-final' || character.voiceType !== 'custom' || character.customVoiceUrl !== 'voice-copy-preview.wav') {
      throw new Error(`音色复制未生效：${JSON.stringify(character)}`)
    }
    if (appearances[0].description !== '全局角色描述') {
      throw new Error(`角色描述复制异常：${JSON.stringify(appearances[0])}`)
    }
    if (appearances[0].imageUrl === input.characterSeedKey) {
      throw new Error(`角色标签图片未重新生成：${JSON.stringify(appearances[0])}`)
    }
    if (location.sourceGlobalLocationId !== input.globalLocationId || location.summary !== '全局场景摘要') {
      throw new Error(`场景来源或摘要异常：${JSON.stringify(location)}`)
    }
    if (!location.selectedImageId || location.selectedImageId !== images[0].id) {
      throw new Error(`场景选中图片异常：${JSON.stringify({ location, images })}`)
    }
    if (images[0].description !== '全局场景描述' || images[0].imageUrl === input.locationSeedKey || images[0].isSelected !== 1) {
      throw new Error(`场景图片复制异常：${JSON.stringify(images[0])}`)
    }

    return {
      copiedAppearanceImageUrl: appearances[0].imageUrl,
      copiedLocationImageUrl: images[0].imageUrl,
      selectedImageId: location.selectedImageId,
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
    const username = `desktop_copy_verify_${Date.now()}`
    const password = 'abc12345'
    await registerUser(username, password)
    const cookieJar = await loginUser(username, password)
    const session = await ensureJsonResponse(
      await fetch(`${BASE_URL}/api/auth/session`, { headers: { Cookie: cookieJar.toHeader() } }),
      '读取会话',
    )
    const userId = session?.user?.id
    if (!userId) throw new Error('会话中缺少 user.id')

    const projectId = await createProject(cookieJar, `复制全局资产回归-${Date.now()}`)
    const { characterId, appearanceId } = await createCharacter(cookieJar, projectId)
    const { locationId } = await createLocation(cookieJar, projectId)

    const characterUpload = await uploadAssetImage(cookieJar, projectId, {
      type: 'character',
      id: characterId,
      appearanceId,
      labelText: '角色种子图',
    })
    const locationUpload = await uploadAssetImage(cookieJar, projectId, {
      type: 'location',
      id: locationId,
      imageIndex: 0,
      labelText: '场景种子图',
    })

    const characterSeedKey = characterUpload?.imageKey
    const locationSeedKey = locationUpload?.imageKey
    if (!characterSeedKey || !locationSeedKey) {
      throw new Error(`上传种子图失败：${JSON.stringify({ characterUpload, locationUpload })}`)
    }

    const seeded = seedGlobalAssets(userId, { characterImageKey: characterSeedKey, locationImageKey: locationSeedKey })

    await copyFromGlobal(cookieJar, projectId, 'character', characterId, seeded.globalCharacterId)
    await copyFromGlobal(cookieJar, projectId, 'location', locationId, seeded.globalLocationId)
    await copyFromGlobal(cookieJar, projectId, 'voice', characterId, seeded.globalVoiceId)

    const dbResult = verifyCopyDbRows({
      characterId,
      locationId,
      globalCharacterId: seeded.globalCharacterId,
      globalLocationId: seeded.globalLocationId,
      characterSeedKey,
      locationSeedKey,
    })

    console.log(JSON.stringify({
      ok: true,
      boot,
      username,
      projectId,
      characterId,
      locationId,
      ...seeded,
      ...dbResult,
    }))
  } finally {
    if (!nextChild.killed) {
      nextChild.kill()
    }
  }
}

await main()




