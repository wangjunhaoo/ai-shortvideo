'use strict'

const path = require('path')
const os = require('os')
const { BrowserWindow, ipcMain } = require('electron')
const { getHardwareFingerprint } = require('./hardware-fingerprint.cjs')
const stateStore = require('./license-state-store.cjs')
const { LicenseClient } = require('./license-client.cjs')

/** 默认离线宽限时间（小时） */
const DEFAULT_OFFLINE_GRACE_HOURS = 72

/**
 * 反调试检测：检查启动参数中是否包含调试相关标志
 * @returns {boolean} 是否检测到调试器
 */
function detectDebugger() {
  const args = process.argv.join(' ').toLowerCase()
  const debugFlags = ['--inspect', '--remote-debugging-port', '--inspect-brk']
  return debugFlags.some((flag) => args.includes(flag))
}

/**
 * 检查授权状态
 * @param {import('electron').App} app
 * @param {LicenseClient} [client]
 * @returns {Promise<{ activated: boolean, licenseKey?: string, plan?: string, expiresAt?: string }>}
 */
async function checkLicenseState(app, client) {
  // 反调试检测
  if (detectDebugger()) {
    console.warn('[license] 检测到调试参数，强制要求联网验证')
  }

  const { fingerprint } = await getHardwareFingerprint()

  // 尝试加载本地状态
  const state = stateStore.load(fingerprint, app)
  if (!state || !state.licenseKey || !state.token) {
    return { activated: false }
  }

  // 检查 license 是否已过期
  if (state.expiresAt && new Date(state.expiresAt) < new Date()) {
    console.warn('[license] 授权已过期')
    stateStore.clear(app)
    return { activated: false }
  }

  // 时钟回拨检测：当前时间早于上次验证时间
  const now = Date.now()
  const lastVerified = state.lastVerifiedAt ? new Date(state.lastVerifiedAt).getTime() : 0
  const clockRolledBack = now < lastVerified

  if (clockRolledBack) {
    console.warn('[license] 检测到时钟回拨，强制联网验证')
  }

  // 尝试心跳验证
  const licenseClient = client || new LicenseClient()
  try {
    const result = await licenseClient.heartbeat(state.licenseKey, fingerprint, app.getVersion())
    // 心跳成功，更新本地状态
    state.lastVerifiedAt = new Date().toISOString()
    if (result.plan) state.plan = result.plan
    if (result.expiresAt) state.expiresAt = result.expiresAt
    stateStore.save(state, fingerprint, app)

    return {
      activated: true,
      licenseKey: state.licenseKey,
      plan: state.plan,
      expiresAt: state.expiresAt,
    }
  } catch (err) {
    console.warn('[license] 心跳验证失败:', err.message)

    // 如果时钟回拨或检测到调试器，强制联网
    if (clockRolledBack || detectDebugger()) {
      return { activated: false }
    }

    // 检查离线宽限期
    const graceHours = state.offlineGraceHours || DEFAULT_OFFLINE_GRACE_HOURS
    const graceMs = graceHours * 60 * 60 * 1000
    const elapsed = now - lastVerified

    if (elapsed <= graceMs) {
      console.log(`[license] 离线宽限期内（已过 ${Math.round(elapsed / 3600000)} 小时 / ${graceHours} 小时）`)
      return {
        activated: true,
        licenseKey: state.licenseKey,
        plan: state.plan,
        expiresAt: state.expiresAt,
      }
    }

    // 超出宽限期
    console.warn('[license] 超出离线宽限期，需要重新激活')
    return { activated: false }
  }
}

/**
 * 显示激活窗口
 * @param {import('electron').App} app
 * @param {LicenseClient} [client]
 * @returns {Promise<void>} 激活成功后 resolve
 */
function showActivationWindow(app, client) {
  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      width: 520,
      height: 480,
      resizable: false,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      autoHideMenuBar: true,
      title: 'waoowaoo - 激活授权',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'license-preload.cjs'),
      },
    })

    const licenseClient = client || new LicenseClient()

    // 注册 IPC 处理器
    const handleActivate = async (_event, licenseKey) => {
      try {
        const { fingerprint, components } = await getHardwareFingerprint()
        const deviceInfo = {
          platform: process.platform,
          arch: process.arch,
          hostname: os.hostname(),
          osVersion: os.release(),
          appVersion: app.getVersion(),
        }

        const result = await licenseClient.activate(licenseKey, fingerprint, components, deviceInfo)

        // 保存激活状态
        const state = {
          licenseKey,
          token: result.token || result.activationId || licenseKey,
          activatedAt: new Date().toISOString(),
          lastVerifiedAt: new Date().toISOString(),
          offlineGraceHours: result.offlineGraceHours || DEFAULT_OFFLINE_GRACE_HOURS,
          plan: result.plan || 'standard',
          expiresAt: result.expiresAt || null,
        }
        stateStore.save(state, fingerprint, app)

        return { success: true, plan: state.plan }
      } catch (err) {
        return { success: false, message: err.message || '激活失败' }
      }
    }

    const handleGetStatus = async () => {
      const { fingerprint } = await getHardwareFingerprint()
      const state = stateStore.load(fingerprint, app)
      return state ? { activated: true, ...state } : { activated: false }
    }

    const handleDeactivate = async () => {
      try {
        const { fingerprint } = await getHardwareFingerprint()
        const state = stateStore.load(fingerprint, app)
        if (state && state.licenseKey) {
          await licenseClient.deactivate(state.licenseKey, fingerprint)
        }
        stateStore.clear(app)
        return { success: true }
      } catch (err) {
        stateStore.clear(app)
        return { success: false, message: err.message }
      }
    }

    let activatedSuccessfully = false

    // 激活处理：成功后延迟关闭窗口
    ipcMain.handle('license:activate', async (event, key) => {
      const result = await handleActivate(event, key)
      if (result.success) {
        activatedSuccessfully = true
        setTimeout(() => {
          cleanup()
          win.close()
        }, 1500)
      }
      return result
    })
    ipcMain.handle('license:getStatus', handleGetStatus)
    ipcMain.handle('license:deactivate', handleDeactivate)

    // 清理 IPC 处理器
    const cleanup = () => {
      ipcMain.removeHandler('license:activate')
      ipcMain.removeHandler('license:getStatus')
      ipcMain.removeHandler('license:deactivate')
    }

    win.on('closed', () => {
      cleanup()
      if (activatedSuccessfully) {
        resolve()
      } else {
        // 窗口被用户关闭且未激活，退出应用
        reject(new Error('用户取消激活'))
      }
    })

    // 加载激活页面
    const htmlPath = path.join(__dirname, 'activation-page.html')
    void win.loadFile(htmlPath)
  })
}

module.exports = { checkLicenseState, showActivationWindow, detectDebugger }
