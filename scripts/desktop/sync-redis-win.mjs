import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const scriptPath = path.join(process.cwd(), 'scripts', 'desktop', 'download-redis-win.ps1')

function runPowerShell(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
    })

    child.on('error', reject)
    child.on('exit', (code) => resolve(code ?? 1))
  })
}

async function main() {
  if (process.platform !== 'win32') {
    console.log('[desktop] 当前系统不是 Windows，跳过 redis Windows 二进制下载。')
    console.log('[desktop] 这一步仅在 Windows 打包或 Windows CI 中需要执行。')
    return
  }

  const args = ['-ExecutionPolicy', 'Bypass', '-File', scriptPath]

  let code = await runPowerShell('powershell', args).catch(() => null)
  if (code === null) {
    code = await runPowerShell('pwsh', args).catch(() => null)
  }

  if (code === null) {
    throw new Error('未检测到 powershell/pwsh，请安装 PowerShell 后重试。')
  }
  if (code !== 0) {
    throw new Error(`Redis 同步失败，PowerShell 退出码: ${code}`)
  }
}

main().catch((error) => {
  console.error('[desktop] 同步 Redis Windows 二进制失败')
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})


