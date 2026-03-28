#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'

const root = process.cwd()
const scanRoot = 'packages/renderer'
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const allowedImportFile = 'packages/renderer/clients/http-client.ts'

function fail(title, details = []) {
  console.error(`\n[renderer-http-transport-guard] ${title}`)
  for (const line of details) {
    console.error(`  - ${line}`)
  }
  process.exit(1)
}

function toRel(fullPath) {
  return path.relative(root, fullPath).split(path.sep).join('/')
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === '.next' || entry.name === 'node_modules') continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, out)
      continue
    }
    if (sourceExtensions.has(path.extname(entry.name))) {
      out.push(fullPath)
    }
  }
  return out
}

function collectViolations(fullPath) {
  const relPath = toRel(fullPath)
  if (relPath === allowedImportFile) return []

  const content = fs.readFileSync(fullPath, 'utf8')
  const lines = content.split('\n')
  const violations = []

  for (let i = 0; i < lines.length; i += 1) {
    if (/from\s+['"]@\/lib\/api-fetch['"]/.test(lines[i])) {
      violations.push(`${relPath}:${i + 1} forbidden direct @/lib/api-fetch import`)
    }
  }

  return violations
}

const allFiles = walk(path.join(root, scanRoot))
const violations = allFiles.flatMap((fullPath) => collectViolations(fullPath))

if (violations.length > 0) {
  fail('Found direct api-fetch imports outside renderer transport client', violations)
}

console.log('[renderer-http-transport-guard] OK')
