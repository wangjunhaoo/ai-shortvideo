const path = require('node:path')

const PRISMA_BIN_PATH = path.join('node_modules', 'prisma', 'build', 'index.js')
const SQLITE_SCHEMA_PATH = path.join('prisma', 'schema.sqlite.prisma')

function assertPrismaRuntimeDependencies({ runtime, assertModuleResolvable }) {
  assertModuleResolvable('@prisma/client', runtime.appRoot)
}

async function smokeTestPrismaRuntimeDependencies({ app, runtime, runNodeOnce }) {
  if (!app.isPackaged) return

  await runNodeOnce({
    name: 'deps-smoke-prisma',
    appRoot: runtime.appRoot,
    logsDir: runtime.logsDir,
    runtimeEnv: runtime.runtimeEnv,
    args: [
      '-e',
      "require('@prisma/client')",
    ],
  })
}

async function ensureSqlitePrismaRuntimeReady({
  app,
  runtime,
  logRuntime,
  runNodeOnce,
  isPrismaClientInitialized,
}) {
  if (!isPrismaClientInitialized(runtime.appRoot)) {
    if (app.isPackaged) {
      throw new Error(
        '当前安装包中的 Prisma Client 未正确生成，请重新执行 desktop:prepare 与 desktop:pack 后安装最新安装包。',
      )
    }

    logRuntime('检测到 Prisma Client 未就绪，尝试在开发环境自动生成')
    await runNodeOnce({
      name: 'prisma-generate',
      appRoot: runtime.appRoot,
      logsDir: runtime.logsDir,
      runtimeEnv: runtime.runtimeEnv,
      args: [
        PRISMA_BIN_PATH,
        'generate',
        '--schema',
        SQLITE_SCHEMA_PATH,
      ],
    })

    if (!isPrismaClientInitialized(runtime.appRoot)) {
      throw new Error('Prisma Client 生成后仍未就绪，请检查 desktop-prisma-generate.log。')
    }
  }

  await runNodeOnce({
    name: 'prisma-db-push',
    appRoot: runtime.appRoot,
    logsDir: runtime.logsDir,
    runtimeEnv: runtime.runtimeEnv,
    args: [
      PRISMA_BIN_PATH,
      'db',
      'push',
      '--schema',
      SQLITE_SCHEMA_PATH,
      '--skip-generate',
    ],
  })
}

module.exports = {
  assertPrismaRuntimeDependencies,
  smokeTestPrismaRuntimeDependencies,
  ensureSqlitePrismaRuntimeReady,
}
