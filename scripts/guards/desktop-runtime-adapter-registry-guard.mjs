#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'

const root = process.cwd()
const mainFile = path.join(root, 'desktop', 'main.cjs')
const registryFile = path.join(root, 'desktop', 'runtime', 'runtime-adapter-registry.cjs')
const engineAdapterFile = path.join(root, 'desktop', 'runtime', 'engine-runtime-adapter.cjs')
const nextAdapterFile = path.join(root, 'desktop', 'runtime', 'next-runtime-adapter.cjs')
const nextHttpSupportFile = path.join(root, 'desktop', 'runtime', 'next-http-runtime-support.cjs')

function fail(title, details = []) {
  console.error(`\n[desktop-runtime-adapter-registry-guard] ${title}`)
  for (const line of details) {
    console.error(`  - ${line}`)
  }
  process.exit(1)
}

if (!fs.existsSync(mainFile)) {
  fail('Missing desktop/main.cjs')
}

if (!fs.existsSync(registryFile)) {
  fail('Missing desktop/runtime/runtime-adapter-registry.cjs')
}

if (!fs.existsSync(engineAdapterFile)) {
  fail('Missing desktop/runtime/engine-runtime-adapter.cjs')
}

if (!fs.existsSync(nextAdapterFile)) {
  fail('Missing desktop/runtime/next-runtime-adapter.cjs retirement stub')
}

if (!fs.existsSync(nextHttpSupportFile)) {
  fail('Missing desktop/runtime/next-http-runtime-support.cjs retirement stub')
}

const mainContent = fs.readFileSync(mainFile, 'utf8')
const registryContent = fs.readFileSync(registryFile, 'utf8')
const engineAdapterContent = fs.readFileSync(engineAdapterFile, 'utf8')
const nextAdapterContent = fs.readFileSync(nextAdapterFile, 'utf8')
const nextHttpSupportContent = fs.readFileSync(nextHttpSupportFile, 'utf8')

if (!/require\('\.\/runtime\/runtime-adapter-registry\.cjs'\)/.test(mainContent)) {
  fail('desktop/main.cjs must resolve adapter through runtime-adapter-registry.cjs')
}

if (/require\('\.\/runtime\/next-runtime-adapter\.cjs'\)/.test(mainContent)) {
  fail('desktop/main.cjs must not import next-runtime-adapter.cjs directly')
}

if (!/resolveRuntimeAdapter\s*\(\s*\)/.test(mainContent)) {
  fail('desktop/main.cjs must call resolveRuntimeAdapter()')
}

if (!/engine:\s*\(\)\s*=>\s*require\('\.\/engine-runtime-adapter\.cjs'\)/.test(registryContent)) {
  fail('runtime-adapter-registry.cjs must lazily register engine runtime adapter')
}

if (!/process\.env\.DESKTOP_RUNTIME_ADAPTER\s*\|\|\s*'engine'/.test(registryContent)) {
  fail('runtime-adapter-registry.cjs must default to engine adapter')
}

if (/next-runtime-adapter\.cjs/.test(registryContent)) {
  fail('runtime-adapter-registry.cjs must not reference next-runtime-adapter.cjs anymore')
}

if (!/engine-runtime-server\.cjs/.test(engineAdapterContent)) {
  fail('engine-runtime-adapter.cjs must start engine-runtime-server.cjs')
}

if (/next-http-runtime-support\.cjs/.test(engineAdapterContent)) {
  fail('engine-runtime-adapter.cjs must not depend on next-http-runtime-support.cjs')
}

if (/'start'/.test(engineAdapterContent) || /\"start\"/.test(engineAdapterContent)) {
  fail('engine-runtime-adapter.cjs must not shell out to next start')
}

if (!/NEXT_RUNTIME_ADAPTER_REMOVED/.test(nextAdapterContent)) {
  fail('next-runtime-adapter.cjs must stay as retirement stub')
}

if (/next-http-runtime-support\.cjs/.test(nextAdapterContent)) {
  fail('next-runtime-adapter.cjs retirement stub must not depend on next-http-runtime-support.cjs')
}

if (
  /require\(['"]\.\/engine-runtime-server\.cjs['"]\)/.test(nextAdapterContent)
  || /\bstartRuntime\b/.test(nextAdapterContent) && /engine-runtime-server\.cjs/.test(nextAdapterContent)
) {
  fail('next-runtime-adapter.cjs retirement stub must not start any runtime')
}

if (!/NEXT_HTTP_RUNTIME_SUPPORT_REMOVED/.test(nextHttpSupportContent)) {
  fail('next-http-runtime-support.cjs must stay as retirement stub')
}

if (
  /require\(['"]\.\/http-runtime-support\.cjs['"]\)/.test(nextHttpSupportContent)
  || /\bstartNodeHttpRuntime\b/.test(nextHttpSupportContent)
  || /\bwaitForHttpRuntimeReady\b/.test(nextHttpSupportContent)
  || /\bNEXT_BIN_PATH\b/.test(nextHttpSupportContent)
) {
  fail('next-http-runtime-support.cjs retirement stub must not depend on runtime helpers or next start')
}

console.log('[desktop-runtime-adapter-registry-guard] OK')
