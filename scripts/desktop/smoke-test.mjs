import fs from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'

function parseArgs(argv) {
  const options = {
    baseUrl: 'http://127.0.0.1:13000',
    launch: null,
    platform: null,
    locale: 'zh',
    timeoutMs: 120_000,
    keepRunning: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]

    if (arg === '--base-url' && next) {
      options.baseUrl = next
      index += 1
      continue
    }
    if (arg === '--launch' && next) {
      options.launch = next
      index += 1
      continue
    }
    if (arg === '--platform' && next) {
      options.platform = next
      index += 1
      continue
    }
    if (arg === '--locale' && next) {
      options.locale = next
      index += 1
      continue
    }
    if (arg === '--timeout-ms' && next) {
      options.timeoutMs = Number.parseInt(next, 10)
      index += 1
      continue
    }
    if (arg === '--keep-running') {
      options.keepRunning = true
    }
  }

  return options
}

function listDirectoryEntries(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true })
  } catch {
    return []
  }
}

function resolveMacAppExecutable(appBundlePath) {
  const appName = path.basename(appBundlePath, '.app')
  return path.join(appBundlePath, 'Contents', 'MacOS', appName)
}

function resolveLaunchTarget(launchPath) {
  const resolvedPath = path.resolve(launchPath)

  if (resolvedPath.toLowerCase().endsWith('.app')) {
    const executablePath = resolveMacAppExecutable(resolvedPath)
    if (!fs.existsSync(executablePath)) {
      throw new Error(`未找到 macOS 应用可执行文件：${executablePath}`)
    }
    return executablePath
  }

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`未找到待启动的打包产物：${resolvedPath}`)
  }

  return resolvedPath
}

function resolveAutoLaunchTarget(platformName) {
  const normalizedPlatform = String(platformName || '').trim().toLowerCase()
  const distDir = path.resolve('dist', 'desktop')

  if (!fs.existsSync(distDir)) {
    throw new Error(`未找到打包输出目录：${distDir}`)
  }

  if (normalizedPlatform === 'win' || normalizedPlatform === 'windows') {
    const unpackedDir = listDirectoryEntries(distDir)
      .filter((entry) => entry.isDirectory() && entry.name.endsWith('-unpacked'))
      .sort((left, right) => left.name.localeCompare(right.name))[0]

    if (!unpackedDir) {
      throw new Error(`未找到 Windows unpacked 目录：${distDir}`)
    }

    const unpackedDirPath = path.join(distDir, unpackedDir.name)
    const exeEntry = listDirectoryEntries(unpackedDirPath)
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.exe'))
      .sort((left, right) => left.name.localeCompare(right.name))[0]

    if (!exeEntry) {
      throw new Error(`未在 ${unpackedDirPath} 中找到可执行 exe`)
    }

    return path.join(unpackedDirPath, exeEntry.name)
  }

  if (normalizedPlatform === 'mac' || normalizedPlatform === 'darwin' || normalizedPlatform === 'macos') {
    const macDir = listDirectoryEntries(distDir)
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('mac'))
      .sort((left, right) => left.name.localeCompare(right.name))[0]

    if (!macDir) {
      throw new Error(`未找到 macOS 打包目录：${distDir}`)
    }

    const macDirPath = path.join(distDir, macDir.name)
    const appBundle = listDirectoryEntries(macDirPath)
      .filter((entry) => entry.isDirectory() && entry.name.endsWith('.app'))
      .sort((left, right) => left.name.localeCompare(right.name))[0]

    if (!appBundle) {
      throw new Error(`未在 ${macDirPath} 中找到 .app bundle`)
    }

    return resolveLaunchTarget(path.join(macDirPath, appBundle.name))
  }

  throw new Error(`不支持自动定位的打包平台：${platformName}`)
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

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie()
  }

  const raw = headers.get('set-cookie')
  if (!raw) return []

  return raw.split(/,(?=\s*[^;,=\s]+=[^;]+)/g)
}

async function waitForBoot(baseUrl, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  let lastError = 'unknown'

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/system/boot-id`, {
        redirect: 'manual',
      })
      if (response.ok) {
        const payload = await response.json()
        return payload.bootId
      }
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }

    await delay(2_000)
  }

  throw new Error(`桌面服务未在 ${timeoutMs}ms 内启动：${lastError}`)
}

async function verifyLandingPage(baseUrl, locale) {
  const response = await fetch(`${baseUrl}/${locale}`, {
    redirect: 'manual',
  })

  const html = await response.text()
  if (!response.ok) {
    throw new Error(`访问 /${locale} 失败：HTTP ${response.status}\n${html}`)
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('text/html')) {
    throw new Error(`访问 /${locale} 失败：返回类型不是 HTML，而是 ${contentType || 'unknown'}`)
  }

  if (!html.includes(`<html lang="${locale}">`)) {
    throw new Error(`访问 /${locale} 失败：页面缺少 <html lang=\"${locale}\"> 标记`)
  }

  return html
}

function extractCriticalChunkPaths(html) {
  return Array.from(
    new Set(
      Array.from(
        html.matchAll(/\/_next\/static\/chunks\/app\/%5Blocale%5D\/[^"'\\s>]+\.js/g),
        (match) => match[0],
      ),
    ),
  )
}

async function verifyCriticalClientChunks(baseUrl, html) {
  const chunkPaths = extractCriticalChunkPaths(html)
  if (chunkPaths.length === 0) {
    throw new Error('页面直出校验失败：未找到 [locale] app chunk，无法验证客户端资源加载')
  }

  for (const chunkPath of chunkPaths) {
    const response = await fetch(`${baseUrl}${chunkPath}`, {
      redirect: 'manual',
    })
    const contentType = response.headers.get('content-type') || ''
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`客户端 chunk 加载失败：${chunkPath} => HTTP ${response.status}\n${body}`)
    }
    if (!contentType.toLowerCase().includes('javascript')) {
      throw new Error(`客户端 chunk 返回类型异常：${chunkPath} => ${contentType || 'unknown'}`)
    }
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

async function registerUser(baseUrl, username, password) {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
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

async function loginUser(baseUrl, locale, username, password) {
  const cookieJar = new CookieJar()

  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`, {
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
    callbackUrl: `${baseUrl}/${locale}/auth/signin`,
    json: 'true',
  })

  const loginResponse = await fetch(`${baseUrl}/api/auth/login?json=true`, {
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

  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
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

async function createProject(baseUrl, cookieJar, projectName) {
  const response = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieJar.toHeader(),
    },
    body: JSON.stringify({
      name: projectName,
      description: '桌面冒烟测试项目',
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

async function verifyProjectList(baseUrl, cookieJar, projectId) {
  const response = await fetch(`${baseUrl}/api/projects?page=1&pageSize=5`, {
    headers: {
      Cookie: cookieJar.toHeader(),
    },
  })
  const payload = await ensureJsonResponse(response, '获取项目列表')
  const projects = Array.isArray(payload?.projects) ? payload.projects : []
  const matched = projects.some((project) => project && project.id === projectId)
  if (!matched) {
    throw new Error(`项目列表未返回刚创建的项目：${projectId}`)
  }
}

async function verifyBillingRoutesUnavailable(baseUrl, cookieJar, projectId) {
  const checks = [
    `${baseUrl}/api/user/balance`,
    `${baseUrl}/api/user/costs`,
    `${baseUrl}/api/user/transactions`,
    `${baseUrl}/api/projects/${projectId}/costs`,
  ]

  for (const url of checks) {
    const response = await fetch(url, {
      headers: {
        Cookie: cookieJar.toHeader(),
      },
    })
    const payload = await response.json().catch(() => ({}))
    if (response.status !== 404 || payload?.code !== 'NOT_FOUND') {
      throw new Error(`账单接口未按预期关闭：${url} -> HTTP ${response.status}`)
    }
  }
}

function launchDesktopApp(executablePath) {
  const resolvedPath = resolveLaunchTarget(executablePath)
  const child = spawn(resolvedPath, [], {
    stdio: 'ignore',
    windowsHide: true,
  })

  child.on('error', (error) => {
    console.error('[desktop-smoke] 启动桌面应用失败')
    console.error(error instanceof Error ? error.message : String(error))
  })

  return child
}

function stopDesktopApp(childProcess) {
  if (!childProcess || childProcess.exitCode !== null || childProcess.killed) return

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(childProcess.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
    return
  }

  childProcess.kill('SIGTERM')
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const timestamp = Date.now()
  const username = `desktop_smoke_${timestamp}`
  const password = `Smoke${timestamp}`
  const projectName = `桌面冒烟项目-${timestamp}`
  let launchedProcess = null

  try {
    const launchTarget = options.launch
      ? resolveLaunchTarget(options.launch)
      : options.platform
        ? resolveAutoLaunchTarget(options.platform)
        : null

    if (options.launch) {
      console.log(`[desktop-smoke] 启动桌面应用: ${launchTarget}`)
      launchedProcess = launchDesktopApp(launchTarget)
    } else if (launchTarget) {
      console.log(`[desktop-smoke] 自动定位桌面应用: ${launchTarget}`)
      launchedProcess = launchDesktopApp(launchTarget)
    }

    console.log('[desktop-smoke] 等待桌面服务启动')
    const bootId = await waitForBoot(options.baseUrl, options.timeoutMs)
    console.log(`[desktop-smoke] 服务已启动: ${bootId}`)

    console.log(`[desktop-smoke] 校验页面直出: /${options.locale}`)
    const landingHtml = await verifyLandingPage(options.baseUrl, options.locale)

    console.log('[desktop-smoke] 校验关键客户端 chunk')
    await verifyCriticalClientChunks(options.baseUrl, landingHtml)

    console.log(`[desktop-smoke] 注册测试用户: ${username}`)
    await registerUser(options.baseUrl, username, password)

    console.log('[desktop-smoke] 执行登录验证')
    const cookieJar = await loginUser(options.baseUrl, options.locale, username, password)

    console.log(`[desktop-smoke] 创建测试项目: ${projectName}`)
    const projectId = await createProject(options.baseUrl, cookieJar, projectName)

    console.log('[desktop-smoke] 校验项目列表')
    await verifyProjectList(options.baseUrl, cookieJar, projectId)

    console.log('[desktop-smoke] 校验账单接口已关闭')
    await verifyBillingRoutesUnavailable(options.baseUrl, cookieJar, projectId)

    console.log('[desktop-smoke] 冒烟检查通过')
    console.log(JSON.stringify({
      ok: true,
      bootId,
      username,
      projectId,
    }))
  } finally {
    if (launchedProcess && !options.keepRunning) {
      stopDesktopApp(launchedProcess)
    }
  }
}

main().catch((error) => {
  console.error('[desktop-smoke] 冒烟检查失败')
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})


