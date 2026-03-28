#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'

const root = process.cwd()
const apiRoot = path.join(root, 'src', 'app', 'api')
const apiErrorsFile = path.join(root, 'src', 'lib', 'api-errors.ts')

function fail(title, details = []) {
  console.error(`\n[app-api-next-runtime-zero-guard] ${title}`)
  for (const line of details) {
    console.error(`  - ${line}`)
  }
  process.exit(1)
}

function walk(dir, collected = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, collected)
      continue
    }
    if (entry.isFile() && fullPath.endsWith('.ts')) {
      collected.push(fullPath)
    }
  }
  return collected
}

if (!fs.existsSync(apiRoot)) {
  fail('Missing src/app/api directory')
}

if (!fs.existsSync(apiErrorsFile)) {
  fail('Missing src/lib/api-errors.ts')
}

const files = [...walk(apiRoot), apiErrorsFile]
const violations = []
const forbiddenPatterns = [
  { pattern: /from\s+['"]next\/server['"]/, label: 'forbidden next/server import' },
  { pattern: /\bNextRequest\b/, label: 'forbidden NextRequest usage' },
  { pattern: /\bNextResponse\b/, label: 'forbidden NextResponse usage' },
  { pattern: /\.nextUrl\b/, label: 'forbidden nextUrl usage' },
]

for (const file of files) {
  const relPath = path.relative(root, file).replaceAll(path.sep, '/')
  const content = fs.readFileSync(file, 'utf8')
  const lines = content.split(/\r?\n/)
  lines.forEach((line, index) => {
    for (const forbidden of forbiddenPatterns) {
      if (forbidden.pattern.test(line)) {
        violations.push(`${relPath}:${index + 1} ${forbidden.label}`)
      }
    }
  })
}

if (violations.length > 0) {
  fail('Found Next runtime request/response dependency in app api layer', violations)
}

console.log('[app-api-next-runtime-zero-guard] OK')
