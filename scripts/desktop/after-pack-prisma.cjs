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

  const appDir = path.join(appOutDir, 'resources', 'app')
  ensureExists(appDir, '请确认当前目标平台为 Windows（win-unpacked）。')
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

module.exports = async function afterPack(context) {
  const appDir = resolvePackagedAppDir(context)
  const schemaPath = resolveSchemaPath(appDir)

  console.log('[desktop][afterPack] Prisma Client 校验开始')
  runPrismaGenerate(appDir, schemaPath)
  assertGeneratedClient(appDir)
  console.log('[desktop][afterPack] Prisma Client 校验通过')
}
