#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'

const root = process.cwd()
const targets = [
  'src/app/m/[publicId]/route.ts',
  'src/lib/desktop-feature-guards.ts',
  'src/lib/billing/service.ts',
  'src/lib/llm-observe/internal-task.ts',
]

function fail(title, details = []) {
  console.error(`\n[desktop-engine-runtime-request-response-zero-guard] ${title}`)
  for (const line of details) {
    console.error(`  - ${line}`)
  }
  process.exit(1)
}

const violations = []

for (const relativePath of targets) {
  const fullPath = path.join(root, ...relativePath.split('/'))
  if (!fs.existsSync(fullPath)) {
    fail('Missing runtime boundary file', [relativePath])
  }

  const content = fs.readFileSync(fullPath, 'utf8')
  const lines = content.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (
      /from\s+['"]next\/server['"]/.test(line)
      || /require\(['"]next\/server['"]\)/.test(line)
      || /\bNextRequest\b/.test(line)
      || /\bNextResponse\b/.test(line)
      || /\bnextUrl\b/.test(line)
    ) {
      violations.push(`${relativePath}:${index + 1} forbidden Next runtime dependency`)
    }
  }
}

if (violations.length > 0) {
  fail('Found forbidden Next runtime dependency in desktop engine boundary files', violations)
}

console.log('[desktop-engine-runtime-request-response-zero-guard] OK')
