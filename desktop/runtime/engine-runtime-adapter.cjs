const path = require('node:path')
const {
  assertPrismaRuntimeDependencies,
  smokeTestPrismaRuntimeDependencies,
  ensureSqlitePrismaRuntimeReady,
} = require('./prisma-runtime-support.cjs')
const {
  assertNextPageRuntimeDependencies,
  smokeTestNextPageRuntimeDependencies,
} = require('./next-page-runtime-support.cjs')
const {
  startNodeHttpRuntime,
  waitForHttpRuntimeReady,
} = require('./http-runtime-support.cjs')

const ENGINE_RUNTIME_SERVER_PATH = path.join('desktop', 'runtime', 'engine-runtime-server.cjs')
const ENGINE_RUNTIME_HEALTH_PATH = '/api/system/boot-id'

function assertEngineRuntimeDependencies({ runtime, assertModuleResolvable }) {
  assertNextPageRuntimeDependencies({ runtime, assertModuleResolvable })
}

async function smokeTestEngineRuntimeDependencies({ app, runtime, runNodeOnce }) {
  await smokeTestNextPageRuntimeDependencies({ app, runtime, runNodeOnce })
}

function ensurePackagedRuntimeDependencies({ app, runtime, assertModuleResolvable, fs }) {
  void app
  void fs
  assertEngineRuntimeDependencies({ runtime, assertModuleResolvable })
  assertPrismaRuntimeDependencies({ runtime, assertModuleResolvable })
}

async function smokeTestPackagedRuntimeDependencies({ app, runtime, runNodeOnce }) {
  await smokeTestEngineRuntimeDependencies({ app, runtime, runNodeOnce })
  await smokeTestPrismaRuntimeDependencies({ app, runtime, runNodeOnce })
}

async function ensureRuntimeReady({
  app,
  runtime,
  logRuntime,
  runNodeOnce,
  isPrismaClientInitialized,
}) {
  await ensureSqlitePrismaRuntimeReady({
    app,
    runtime,
    logRuntime,
    runNodeOnce,
    isPrismaClientInitialized,
  })
}

function startRuntime({ app, dialog, runtime, spawnNodeProcess, logRuntime }) {
  startNodeHttpRuntime({
    app,
    dialog,
    runtime,
    spawnNodeProcess,
    logRuntime,
    name: 'engine-runtime',
    args: [ENGINE_RUNTIME_SERVER_PATH],
    startupLabel: '启动本地 engine runtime',
  })
}

async function waitForRuntimeReady({ runtime, logRuntime, waitForBoot }) {
  await waitForHttpRuntimeReady({
    runtime,
    logRuntime,
    waitForBoot,
    healthPath: ENGINE_RUNTIME_HEALTH_PATH,
    readinessLabel: '等待本地 engine runtime 健康检查',
  })
}

module.exports = {
  ensurePackagedRuntimeDependencies,
  smokeTestPackagedRuntimeDependencies,
  ensureRuntimeReady,
  startRuntime,
  waitForRuntimeReady,
}
