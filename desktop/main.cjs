const { app, BrowserWindow, dialog, shell } = require('electron')
const { spawn } = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const http = require('node:http')
const path = require('node:path')

const APP_PORT_DEFAULT = 13000
const REDIS_PORT_DEFAULT = 16379
const BOOT_TIMEOUT_MS = 90_000

/** @type {Array<{name: string, child: import('node:child_process').ChildProcess}>} */
const managedChildren = []
let isShuttingDown = false
/** @type {BrowserWindow | null} */
let mainWindow = null

function logDesktop(message, detail) {
  if (detail === undefined) {
    console.log(`[desktop] ${message}`)
    return
  }
  console.log(`[desktop] ${message}`, detail)
}

function randomHex(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex')
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true })
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fsp.readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJson(filePath, value) {
  await fsp.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function appendProcessLog(logFilePath, source, chunk) {
  const line = chunk.toString()
  const prefix = `[${new Date().toISOString()}] [${source}] `
  fs.appendFileSync(logFilePath, `${prefix}${line}`)
}

function joinWindowsPathForPrisma(filePath) {
  // Prisma SQLite 在 Windows 下使用 file:///C:/... 可能触发路径解析异常，统一为 file:C:/...
  const normalized = path.resolve(filePath).replace(/\\/g, '/')
  return `file:${normalized}`
}

function buildEnvFileContent(env) {
  return Object.entries(env)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('\n')
}

async function ensureRuntimeConfig(userDataDir) {
  const runtimeConfigPath = path.join(userDataDir, 'runtime-config.json')
  const existing = await readJson(runtimeConfigPath, {})

  const runtimeConfig = {
    appPort: Number(existing.appPort) || APP_PORT_DEFAULT,
    redisPort: Number(existing.redisPort) || REDIS_PORT_DEFAULT,
    nextAuthSecret: existing.nextAuthSecret || randomHex(32),
    cronSecret: existing.cronSecret || randomHex(24),
    internalTaskToken: existing.internalTaskToken || randomHex(24),
    apiEncryptionKey: existing.apiEncryptionKey || randomHex(24),
  }

  await writeJson(runtimeConfigPath, runtimeConfig)
  return runtimeConfig
}

function resolveRedisBinary(appRoot) {
  const candidates = [
    path.join(process.resourcesPath, 'redis', 'windows', 'redis-server.exe'),
    path.join(appRoot, 'desktop', 'bin', 'redis', 'windows', 'redis-server.exe'),
  ]

  return candidates.find((candidate) => fs.existsSync(candidate)) || null
}

function isPrismaClientInitialized(appRoot) {
  const defaultClientPath = path.join(appRoot, 'node_modules', '.prisma', 'client', 'default.js')
  if (!fs.existsSync(defaultClientPath)) {
    return false
  }
  try {
    const content = fs.readFileSync(defaultClientPath, 'utf8')
    return !content.includes('did not initialize yet')
  } catch {
    return false
  }
}

function buildSpawnEnv(runtimeEnv) {
  return {
    ...process.env,
    ...runtimeEnv,
    ELECTRON_RUN_AS_NODE: '1',
  }
}

function registerManagedProcess(name, child, logFilePath, critical = true) {
  managedChildren.push({ name, child })

  child.stdout?.on('data', (chunk) => appendProcessLog(logFilePath, `${name}:stdout`, chunk))
  child.stderr?.on('data', (chunk) => appendProcessLog(logFilePath, `${name}:stderr`, chunk))

  child.on('exit', (code, signal) => {
    if (isShuttingDown) return
    const reason = `进程 ${name} 意外退出（code=${code ?? 'null'}, signal=${signal ?? 'null'}）`
    appendProcessLog(logFilePath, `${name}:system`, `${reason}\n`)
    if (!critical) {
      logDesktop('非关键进程退出，应用继续运行', { name, code, signal })
      return
    }
    dialog.showErrorBox('waoowaoo 运行异常', `${reason}\n请重启应用，若仍失败请查看日志目录。`)
    app.quit()
  })
}

function spawnNodeProcess(params) {
  const { name, appRoot, args, runtimeEnv, logsDir, critical = true } = params
  const logFilePath = path.join(logsDir, `desktop-${name}.log`)
  const child = spawn(process.execPath, args, {
    cwd: appRoot,
    env: buildSpawnEnv(runtimeEnv),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  registerManagedProcess(name, child, logFilePath, critical)
  return child
}

async function runNodeOnce(params) {
  const { name, appRoot, args, runtimeEnv, logsDir } = params
  const logFilePath = path.join(logsDir, `desktop-${name}.log`)

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: appRoot,
      env: buildSpawnEnv(runtimeEnv),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })

    let stderr = ''
    child.stdout?.on('data', (chunk) => appendProcessLog(logFilePath, `${name}:stdout`, chunk))
    child.stderr?.on('data', (chunk) => {
      const text = chunk.toString()
      stderr += text
      appendProcessLog(logFilePath, `${name}:stderr`, chunk)
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined)
        return
      }
      reject(new Error(`步骤 ${name} 失败，退出码 ${code}\n${stderr}`))
    })
  })
}

async function ensurePrismaClientReady(runtime) {
  if (isPrismaClientInitialized(runtime.appRoot)) {
    return
  }

  if (app.isPackaged) {
    throw new Error(
      '当前安装包中的 Prisma Client 未正确生成，请重新执行 desktop:prepare 与 desktop:pack 后安装最新安装包。',
    )
  }

  logDesktop('检测到 Prisma Client 未就绪，尝试在开发环境自动生成')
  await runNodeOnce({
    name: 'prisma-generate',
    appRoot: runtime.appRoot,
    logsDir: runtime.logsDir,
    runtimeEnv: runtime.runtimeEnv,
    args: [
      path.join('node_modules', 'prisma', 'build', 'index.js'),
      'generate',
      '--schema',
      path.join('prisma', 'schema.sqlite.prisma'),
    ],
  })

  if (!isPrismaClientInitialized(runtime.appRoot)) {
    throw new Error('Prisma Client 生成后仍未就绪，请检查 desktop-prisma-generate.log。')
  }
}

function spawnRedisProcess(params) {
  const { redisBinaryPath, runtimeEnv, logsDir } = params
  const logFilePath = path.join(logsDir, 'desktop-redis.log')
  const args = [
    '--bind', '127.0.0.1',
    '--port', String(runtimeEnv.REDIS_PORT),
    '--save', '',
    '--appendonly', 'no',
  ]

  const child = spawn(redisBinaryPath, args, {
    cwd: path.dirname(redisBinaryPath),
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  registerManagedProcess('redis', child, logFilePath)
  return child
}

async function waitForBoot(url, timeoutMs) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    const ok = await new Promise((resolve) => {
      const req = http.get(url, (res) => {
        res.resume()
        resolve((res.statusCode || 500) < 500)
      })
      req.on('error', () => resolve(false))
      req.setTimeout(2_500, () => {
        req.destroy()
        resolve(false)
      })
    })

    if (ok) return
    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }
  throw new Error(`服务启动超时：${url}`)
}

async function buildDesktopRuntime(appRoot) {
  const userDataDir = app.getPath('userData')
  const dataDir = path.join(userDataDir, 'data')
  const logsDir = path.join(userDataDir, 'logs')
  const uploadDir = path.join(userDataDir, 'uploads')
  const runtimeDir = path.join(userDataDir, 'runtime')
  await Promise.all([ensureDir(dataDir), ensureDir(logsDir), ensureDir(uploadDir), ensureDir(runtimeDir)])

  const runtimeConfig = await ensureRuntimeConfig(userDataDir)
  const databaseUrl = joinWindowsPathForPrisma(path.join(dataDir, 'waoowaoo.db'))
  const appUrl = `http://127.0.0.1:${runtimeConfig.appPort}`

  const runtimeEnv = {
    NODE_ENV: 'production',
    DATABASE_URL: databaseUrl,
    STORAGE_TYPE: 'local',
    UPLOAD_DIR: uploadDir,
    NEXTAUTH_URL: appUrl,
    INTERNAL_APP_URL: appUrl,
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: String(runtimeConfig.redisPort),
    REDIS_USERNAME: '',
    REDIS_PASSWORD: '',
    REDIS_TLS: '',
    NEXTAUTH_SECRET: runtimeConfig.nextAuthSecret,
    CRON_SECRET: runtimeConfig.cronSecret,
    INTERNAL_TASK_TOKEN: runtimeConfig.internalTaskToken,
    API_ENCRYPTION_KEY: runtimeConfig.apiEncryptionKey,
    LOG_UNIFIED_ENABLED: 'true',
    LOG_LEVEL: 'INFO',
    LOG_FORMAT: 'json',
    LOG_DEBUG_ENABLED: 'false',
    LOG_AUDIT_ENABLED: 'true',
    LOG_SERVICE: 'waoowaoo-desktop',
    LOG_DIR: logsDir,
    BILLING_MODE: 'OFF',
    LLM_STREAM_EPHEMERAL_ENABLED: 'true',
  }

  const envFilePath = path.join(runtimeDir, '.env.desktop')
  await fsp.writeFile(envFilePath, `${buildEnvFileContent(runtimeEnv)}\n`, 'utf8')

  return {
    appRoot,
    appUrl,
    appPort: runtimeConfig.appPort,
    logsDir,
    runtimeEnv,
    envFilePath,
  }
}

async function startManagedRuntime(runtime) {
  const redisBinaryPath = resolveRedisBinary(runtime.appRoot)
  if (!redisBinaryPath) {
    throw new Error('未找到 redis-server.exe，请先执行 desktop:sync:redis:win 或在 CI 中下载 Redis 二进制。')
  }

  logDesktop('准备数据库结构')
  await ensurePrismaClientReady(runtime)

  await runNodeOnce({
    name: 'prisma-db-push',
    appRoot: runtime.appRoot,
    logsDir: runtime.logsDir,
    runtimeEnv: runtime.runtimeEnv,
    args: [
      path.join('node_modules', 'prisma', 'build', 'index.js'),
      'db',
      'push',
      '--schema',
      path.join('prisma', 'schema.sqlite.prisma'),
      '--skip-generate',
    ],
  })

  logDesktop('启动 Redis')
  spawnRedisProcess({
    redisBinaryPath,
    runtimeEnv: runtime.runtimeEnv,
    logsDir: runtime.logsDir,
  })

  logDesktop('启动 Web 服务')
  spawnNodeProcess({
    name: 'next',
    appRoot: runtime.appRoot,
    runtimeEnv: runtime.runtimeEnv,
    logsDir: runtime.logsDir,
    args: [
      path.join('node_modules', 'next', 'dist', 'bin', 'next'),
      'start',
      '-H',
      '127.0.0.1',
      '-p',
      String(runtime.appPort),
    ],
  })

  logDesktop('启动 Worker')
  spawnNodeProcess({
    name: 'worker',
    appRoot: runtime.appRoot,
    runtimeEnv: runtime.runtimeEnv,
    logsDir: runtime.logsDir,
    args: [
      path.join('node_modules', 'tsx', 'dist', 'cli.mjs'),
      '--env-file',
      runtime.envFilePath,
      path.join('src', 'lib', 'workers', 'index.ts'),
    ],
  })

  logDesktop('启动 Watchdog')
  spawnNodeProcess({
    name: 'watchdog',
    appRoot: runtime.appRoot,
    runtimeEnv: runtime.runtimeEnv,
    logsDir: runtime.logsDir,
    critical: false,
    args: [
      path.join('node_modules', 'tsx', 'dist', 'cli.mjs'),
      '--env-file',
      runtime.envFilePath,
      path.join('scripts', 'watchdog.ts'),
    ],
  })

  logDesktop('等待服务健康检查')
  await waitForBoot(`${runtime.appUrl}/api/system/boot-id`, BOOT_TIMEOUT_MS)
}

function createMainWindow(appUrl) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  void mainWindow.loadURL(appUrl)
}

function shutdownManagedProcesses() {
  isShuttingDown = true
  for (const { child } of managedChildren) {
    if (!child.killed) {
      child.kill()
    }
  }
}

async function bootstrap() {
  const lock = app.requestSingleInstanceLock()
  if (!lock) {
    app.quit()
    return
  }

  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app.on('before-quit', () => {
    shutdownManagedProcesses()
  })

  app.on('window-all-closed', () => {
    app.quit()
  })

  await app.whenReady()
  const appRoot = app.getAppPath()
  const runtime = await buildDesktopRuntime(appRoot)
  await startManagedRuntime(runtime)
  createMainWindow(runtime.appUrl)
}

void bootstrap().catch((error) => {
  console.error('[desktop] 启动失败', error)
  dialog.showErrorBox('waoowaoo 启动失败', error instanceof Error ? error.message : String(error))
  app.quit()
})
