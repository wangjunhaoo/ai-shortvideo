const { spawn } = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const http = require('node:http')
const path = require('node:path')

const APP_PORT_DEFAULT = 13000
const BOOT_TIMEOUT_MS = 90_000

/** @type {Array<{name: string, child: import('node:child_process').ChildProcess}>} */
const managedChildren = []
let isShuttingDown = false

function logRuntime(message, detail) {
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
  const query = new URLSearchParams({
    connection_limit: '1',
    socket_timeout: '30',
  })
  return `file:${normalized}?${query.toString()}`
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
    authSessionSecret: existing.authSessionSecret || randomHex(32),
    cronSecret: existing.cronSecret || randomHex(24),
    internalTaskToken: existing.internalTaskToken || randomHex(24),
    apiEncryptionKey: existing.apiEncryptionKey || randomHex(24),
  }

  await writeJson(runtimeConfigPath, runtimeConfig)
  return runtimeConfig
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

function assertModuleResolvable(moduleName, fromDir) {
  try {
    require.resolve(moduleName, { paths: [fromDir] })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`安装包依赖校验失败: ${moduleName}\nfrom: ${fromDir}\nreason: ${reason}`)
  }
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

function buildSpawnEnv(runtimeEnv) {
  return {
    ...process.env,
    ...runtimeEnv,
    ELECTRON_RUN_AS_NODE: '1',
  }
}

function registerManagedProcess({ app, dialog, name, child, logFilePath, critical = true }) {
  managedChildren.push({ name, child })

  child.stdout?.on('data', (chunk) => appendProcessLog(logFilePath, `${name}:stdout`, chunk))
  child.stderr?.on('data', (chunk) => appendProcessLog(logFilePath, `${name}:stderr`, chunk))

  child.on('exit', (code, signal) => {
    if (isShuttingDown) return
    const reason = `进程 ${name} 意外退出（code=${code ?? 'null'}, signal=${signal ?? 'null'}）`
    appendProcessLog(logFilePath, `${name}:system`, `${reason}\n`)
    if (!critical) {
      logRuntime('非关键进程退出，应用继续运行', { name, code, signal })
      return
    }
    dialog.showErrorBox('soloclew-video 运行异常', `${reason}\n请重启应用，若仍失败请查看日志目录。`)
    app.quit()
  })
}

function spawnNodeProcess(params) {
  const {
    app,
    dialog,
    name,
    appRoot,
    args,
    runtimeEnv,
    logsDir,
    critical = true,
  } = params
  const logFilePath = path.join(logsDir, `desktop-${name}.log`)
  const child = spawn(process.execPath, args, {
    cwd: appRoot,
    env: buildSpawnEnv(runtimeEnv),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  registerManagedProcess({ app, dialog, name, child, logFilePath, critical })
  return child
}

async function waitForBoot(url, timeoutMs = BOOT_TIMEOUT_MS) {
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

async function buildDesktopRuntime(app, appRoot) {
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
    DESKTOP_LOCAL_TASKS: 'true',
    APP_BASE_URL: appUrl,
    INTERNAL_APP_URL: appUrl,
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

function resolveRuntimeAppRoot(app) {
  const currentAppPath = app.getAppPath()
  if (app.isPackaged) {
    return currentAppPath
  }

  const repoRoot = path.resolve(currentAppPath, '..')
  if (fs.existsSync(path.join(repoRoot, 'package.json'))) {
    return repoRoot
  }

  return currentAppPath
}

async function startManagedRuntime({ app, dialog, runtime, adapter }) {
  adapter.ensurePackagedRuntimeDependencies({
    app,
    runtime,
    assertModuleResolvable,
    fs,
  })
  logRuntime('校验运行时依赖')
  await adapter.smokeTestPackagedRuntimeDependencies({
    app,
    runtime,
    runNodeOnce,
  })

  logRuntime('准备数据库结构')
  await adapter.ensureRuntimeReady({
    app,
    runtime,
    logRuntime,
    runNodeOnce,
    isPrismaClientInitialized,
  })

  adapter.startRuntime({
    app,
    dialog,
    runtime,
    spawnNodeProcess,
    logRuntime,
  })
  await adapter.waitForRuntimeReady({
    runtime,
    logRuntime,
    waitForBoot,
  })
}

function shutdownManagedProcesses() {
  isShuttingDown = true
  for (const { child } of managedChildren) {
    if (!child.killed) {
      child.kill()
    }
  }
}

module.exports = {
  buildDesktopRuntime,
  resolveRuntimeAppRoot,
  shutdownManagedProcesses,
  startManagedRuntime,
}
