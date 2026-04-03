const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

function ensureExists(filePath, hint) {
  if (fs.existsSync(filePath)) return
  throw new Error(`[desktop][afterPack] 文件不存在: ${filePath}${hint ? `；${hint}` : ''}`)
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function resolvePackagedAppDir(context) {
  const appOutDir = context && context.appOutDir
  if (!appOutDir) {
    throw new Error('[desktop][afterPack] 缺少 appOutDir，无法定位打包产物目录。')
  }

  if (context.electronPlatformName === 'darwin') {
    const productFilename = context.packager?.appInfo?.productFilename
    if (!productFilename) {
      throw new Error('[desktop][afterPack] 缺少 productFilename，无法定位 macOS 应用 bundle。')
    }

    const appDir = path.join(appOutDir, `${productFilename}.app`, 'Contents', 'Resources', 'app')
    ensureExists(appDir, '请确认当前目标平台的 .app bundle 已生成。')
    return appDir
  }

  const appDir = path.join(appOutDir, 'resources', 'app')
  ensureExists(appDir, '请确认当前目标平台的 resources/app 目录已生成。')
  return appDir
}

function resolveSchemaPath(appDir) {
  const sqliteSchema = path.join(appDir, 'prisma', 'schema.sqlite.prisma')
  if (fs.existsSync(sqliteSchema)) return sqliteSchema
  const defaultSchema = path.join(appDir, 'prisma', 'schema.prisma')
  ensureExists(defaultSchema, '未找到 Prisma schema。')
  return defaultSchema
}

function runPrismaGenerate(appDir, schemaPath) {
  const prismaCliPath = path.join(appDir, 'node_modules', 'prisma', 'build', 'index.js')
  ensureExists(prismaCliPath, '请确认 prisma 依赖已被打包。')

  const result = spawnSync(
    process.execPath,
    [prismaCliPath, 'generate', '--schema', schemaPath],
    {
      cwd: appDir,
      env: { ...process.env, PRISMA_HIDE_UPDATE_MESSAGE: '1' },
      encoding: 'utf8',
    },
  )

  if (result.status !== 0) {
    const stdout = (result.stdout || '').trim()
    const stderr = (result.stderr || '').trim()
    throw new Error(
      `[desktop][afterPack] Prisma generate 失败（exit=${result.status}）。\nstdout:\n${stdout}\nstderr:\n${stderr}`,
    )
  }
}

function assertGeneratedClient(appDir) {
  const generatedDefaultPath = path.join(appDir, 'node_modules', '.prisma', 'client', 'default.js')
  ensureExists(generatedDefaultPath, '缺少 node_modules/.prisma/client/default.js。')

  const generatedDefault = readText(generatedDefaultPath)
  if (generatedDefault.includes('did not initialize yet')) {
    throw new Error('[desktop][afterPack] 发现未初始化 Prisma Client 占位文件。')
  }

  const clientDir = path.dirname(generatedDefaultPath)
  const files = fs.readdirSync(clientDir)
  const hasEngineArtifact = files.some((name) => name.includes('query_engine') || name.includes('libquery_engine'))
  if (!hasEngineArtifact) {
    throw new Error('[desktop][afterPack] Prisma 引擎文件缺失，客户端不可用。')
  }

  const prismaProxyPath = path.join(appDir, 'node_modules', '@prisma', 'client', 'default.js')
  ensureExists(prismaProxyPath, '缺少 @prisma/client/default.js。')
}

function ensureBullmqNestedCommands(appDir) {
  const nestedCommandsDir = path.join(appDir, 'node_modules', 'bullmq', 'node_modules', '@ioredis', 'commands')
  const nestedBuiltIndex = path.join(nestedCommandsDir, 'built', 'index.js')
  if (fs.existsSync(nestedBuiltIndex)) return

  const topLevelCommandsDir = path.join(appDir, 'node_modules', '@ioredis', 'commands')
  const topLevelBuiltDir = path.join(topLevelCommandsDir, 'built')
  const topLevelBuiltIndex = path.join(topLevelBuiltDir, 'index.js')
  ensureExists(topLevelBuiltIndex, '缺少顶层 @ioredis/commands/built/index.js，无法修复 bullmq 嵌套依赖。')

  fs.mkdirSync(nestedCommandsDir, { recursive: true })
  fs.cpSync(topLevelBuiltDir, path.join(nestedCommandsDir, 'built'), { recursive: true, force: true })

  const copyCandidates = ['package.json', 'commands.json', 'README.md', 'LICENSE']
  for (const fileName of copyCandidates) {
    const sourcePath = path.join(topLevelCommandsDir, fileName)
    if (!fs.existsSync(sourcePath)) continue
    fs.copyFileSync(sourcePath, path.join(nestedCommandsDir, fileName))
  }

  ensureExists(
    nestedBuiltIndex,
    '修复后仍缺少 bullmq/node_modules/@ioredis/commands/built/index.js。',
  )
}

function assertModuleResolvable(moduleName, fromDir) {
  try {
    require.resolve(moduleName, { paths: [fromDir] })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(
      `[desktop][afterPack] 模块解析失败: ${moduleName}\nfrom: ${fromDir}\nreason: ${reason}`,
    )
  }
}

function assertRuntimeEntrypoints(appDir) {
  const requiredPaths = [
    path.join(appDir, 'node_modules', 'next', 'dist', 'bin', 'next'),
    path.join(appDir, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    path.join(appDir, 'src', 'lib', 'workers', 'index.ts'),
    path.join(appDir, 'scripts', 'watchdog.ts'),
  ]

  for (const requiredPath of requiredPaths) {
    ensureExists(requiredPath, '桌面运行时入口文件缺失。')
  }
}

function assertCriticalModuleResolution(appDir) {
  const bullmqDir = path.join(appDir, 'node_modules', 'bullmq')
  ensureExists(bullmqDir, '缺少 node_modules/bullmq。')

  const checks = [
    { moduleName: '@prisma/client', fromDir: appDir },
    { moduleName: 'bullmq', fromDir: appDir },
    { moduleName: 'ioredis', fromDir: appDir },
    { moduleName: 'sharp', fromDir: appDir },
    { moduleName: '@ioredis/commands', fromDir: bullmqDir },
  ]

  for (const check of checks) {
    assertModuleResolvable(check.moduleName, check.fromDir)
  }
}

function runRuntimeDependencySmokeTest(appDir) {
  const smokeScript = `
    require('@prisma/client')
    const bullmq = require('bullmq')
    if (!bullmq || typeof bullmq.Queue !== 'function') {
      throw new Error('bullmq.Queue 不可用')
    }
    require('ioredis')
    require('sharp')
  `

  const result = spawnSync(process.execPath, ['-e', smokeScript], {
    cwd: appDir,
    env: { ...process.env, PRISMA_HIDE_UPDATE_MESSAGE: '1' },
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    const stdout = (result.stdout || '').trim()
    const stderr = (result.stderr || '').trim()
    throw new Error(
      `[desktop][afterPack] 运行时依赖烟雾测试失败（exit=${result.status}）。\nstdout:\n${stdout}\nstderr:\n${stderr}`,
    )
  }
}

module.exports = async function afterPack(context) {
  const appDir = resolvePackagedAppDir(context)
  const schemaPath = resolveSchemaPath(appDir)

  console.log('[desktop][afterPack] Prisma Client 校验开始')
  runPrismaGenerate(appDir, schemaPath)
  assertGeneratedClient(appDir)
  ensureBullmqNestedCommands(appDir)
  assertRuntimeEntrypoints(appDir)
  assertCriticalModuleResolution(appDir)
  runRuntimeDependencySmokeTest(appDir)
  console.log('[desktop][afterPack] Prisma Client 校验通过')
}
