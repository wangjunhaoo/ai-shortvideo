#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'

const root = process.cwd()
const serverFile = path.join(root, 'desktop', 'runtime', 'engine-runtime-server.cjs')

function fail(title, details = []) {
  console.error(`\n[desktop-engine-runtime-next-handler-zero-guard] ${title}`)
  for (const line of details) {
    console.error(`  - ${line}`)
  }
  process.exit(1)
}

if (!fs.existsSync(serverFile)) {
  fail('Missing desktop/runtime/engine-runtime-server.cjs')
}

const content = fs.readFileSync(serverFile, 'utf8')

if (/require\('next'\)/.test(content)) {
  fail('engine-runtime-server.cjs must not require next directly')
}

if (/getRequestHandler\s*\(/.test(content)) {
  fail('engine-runtime-server.cjs must not use nextApp.getRequestHandler()')
}

if (/nextApp\.prepare\s*\(/.test(content)) {
  fail('engine-runtime-server.cjs must not prepare a Next app runtime')
}

if (!/createPageModuleDispatcher/.test(content)) {
  fail('engine-runtime-server.cjs must dispatch page modules directly')
}

if (!/createStaticAssetDispatcher/.test(content)) {
  fail('engine-runtime-server.cjs must dispatch static assets directly')
}

console.log('[desktop-engine-runtime-next-handler-zero-guard] OK')
