const { app, BrowserWindow, dialog, shell } = require('electron')
const {
  buildDesktopRuntime,
  resolveRuntimeAppRoot,
  shutdownManagedProcesses,
  startManagedRuntime,
} = require('./runtime/managed-web-runtime.cjs')
const { resolveRuntimeAdapter } = require('./runtime/runtime-adapter-registry.cjs')

/** @type {BrowserWindow | null} */
let mainWindow = null

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
    shutdownManagedProcesses()
  })

  app.on('window-all-closed', () => {
    app.quit()
  })

  await app.whenReady()
  const appRoot = resolveRuntimeAppRoot(app)
  const runtime = await buildDesktopRuntime(app, appRoot)
  const adapter = resolveRuntimeAdapter()
  await startManagedRuntime({ app, dialog, runtime, adapter })
  createMainWindow(runtime.appUrl)
}

void bootstrap().catch((error) => {
  console.error('[desktop] 启动失败', error)
  dialog.showErrorBox('waoowaoo 启动失败', error instanceof Error ? error.message : String(error))
  app.quit()
})
