function startNodeHttpRuntime({
  app,
  dialog,
  runtime,
  spawnNodeProcess,
  logRuntime,
  name,
  args,
  startupLabel = '启动 Web 服务',
}) {
  logRuntime(startupLabel)
  spawnNodeProcess({
    app,
    dialog,
    name,
    appRoot: runtime.appRoot,
    runtimeEnv: runtime.runtimeEnv,
    logsDir: runtime.logsDir,
    args,
  })
}

async function waitForHttpRuntimeReady({
  runtime,
  logRuntime,
  waitForBoot,
  healthPath,
  readinessLabel = '等待服务健康检查',
}) {
  logRuntime(readinessLabel)
  await waitForBoot(`${runtime.appUrl}${healthPath}`)
}

module.exports = {
  startNodeHttpRuntime,
  waitForHttpRuntimeReady,
}
