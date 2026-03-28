import { spawn, spawnSync } from 'node:child_process'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'

const BASE_URL = 'http://127.0.0.1:13000'

function getNpmCommand() {
  if (process.platform === 'win32') {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', 'npm run desktop:run'],
    }
  }

  return {
    command: 'npm',
    args: ['run', 'desktop:run'],
  }
}

function terminateProcessTree(childProcess) {
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

async function waitForBoot(childProcess, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs
  let lastError = 'unknown'

  while (Date.now() < deadline) {
    if (childProcess.exitCode !== null) {
      throw new Error(`desktop:run 提前退出，exitCode=${childProcess.exitCode}`)
    }

    try {
      const response = await fetch(`${BASE_URL}/api/system/boot-id`)
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

  throw new Error(`desktop:run 在 ${timeoutMs}ms 内未完成启动：${lastError}`)
}

async function runSmoke() {
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['scripts/desktop/smoke-test.mjs', '--base-url', BASE_URL],
      {
        stdio: 'inherit',
        windowsHide: true,
      },
    )

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined)
        return
      }
      reject(new Error(`桌面冒烟脚本失败，exitCode=${code}`))
    })
  })
}

async function main() {
  console.log('[desktop-verify-local] 启动本地桌面运行时')
  const npmProcess = getNpmCommand()
  const desktopProcess = spawn(npmProcess.command, npmProcess.args, {
    stdio: 'inherit',
    windowsHide: true,
  })

  try {
    const bootId = await waitForBoot(desktopProcess)
    console.log(`[desktop-verify-local] 本地桌面已启动: ${bootId}`)
    await runSmoke()
    console.log('[desktop-verify-local] 本地桌面冒烟通过')
  } finally {
    terminateProcessTree(desktopProcess)
  }
}

main().catch((error) => {
  console.error('[desktop-verify-local] 校验失败')
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})


