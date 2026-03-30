const { app, BrowserWindow, dialog, shell } = require('electron')
const {
  buildDesktopRuntime,
  resolveRuntimeAppRoot,
  shutdownManagedProcesses,
  startManagedRuntime,
} = require('./runtime/managed-web-runtime.cjs')
const { resolveRuntimeAdapter } = require('./runtime/runtime-adapter-registry.cjs')
const { checkLicenseState, showActivationWindow } = require('./license/license-guard.cjs')
const { LicenseClient } = require('./license/license-client.cjs')
const { getHardwareFingerprint } = require('./license/hardware-fingerprint.cjs')

/** @type {BrowserWindow | null} */
let mainWindow = null

/** @type {(() => void) | null} 心跳停止函数 */
let stopHeartbeat = null

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
    if (stopHeartbeat) stopHeartbeat()
    shutdownManagedProcesses()
  })

  app.on('window-all-closed', () => {
    app.quit()
  })

  await app.whenReady()

  // License 授权检查
  const licenseClient = new LicenseClient()
  const licenseState = await checkLicenseState(app, licenseClient)
  if (!licenseState.activated) {
    try {
      await showActivationWindow(app, licenseClient)
    } catch {
      // 用户关闭激活窗口，静默退出
      app.quit()
      return
    }
  }

  // License 验证通过，启动主应用
  const appRoot = resolveRuntimeAppRoot(app)
  const runtime = await buildDesktopRuntime(app, appRoot)
  const adapter = resolveRuntimeAdapter()
  await startManagedRuntime({ app, dialog, runtime, adapter })
  createMainWindow(runtime.appUrl)

  // 启动心跳循环（重新读取状态以获取最新的 licenseKey）
  const { fingerprint } = await getHardwareFingerprint()
  const stateStore = require('./license/license-state-store.cjs')
  const currentState = stateStore.load(fingerprint, app)
  if (currentState && currentState.licenseKey) {
    stopHeartbeat = licenseClient.startHeartbeatLoop(currentState.licenseKey, fingerprint, app.getVersion())
  }
}

void bootstrap().catch((error) => {
  console.error('[desktop] 启动失败', error)
  dialog.showErrorBox('soloclew-video 启动失败', error instanceof Error ? error.message : String(error))
  app.quit()
})
