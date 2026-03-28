#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'

const root = process.cwd()
const scanRoot = 'packages/renderer'
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const forbiddenPatterns = [
  {
    name: 'legacy auth callback endpoint',
    test: (line) => /\/api\/auth\/callback\/credentials/.test(line),
  },
  {
    name: 'legacy auth signout endpoint',
    test: (line) => /\/api\/auth\/signout\b/.test(line),
  },
]

function fail(title, details = []) {
  console.error(`\n[renderer-auth-route-neutrality-guard] ${title}`)
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
  const content = fs.readFileSync(fullPath, 'utf8')
  const lines = content.split('\n')
  const violations = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(line)) {
        violations.push(`${relPath}:${i + 1} forbidden: ${pattern.name}`)
      }
    }
  }

  return violations
}

const allFiles = walk(path.join(root, scanRoot))
const violations = allFiles.flatMap((fullPath) => collectViolations(fullPath))

if (violations.length > 0) {
  fail('Found legacy next-auth route usage in packages/renderer', violations)
}

console.log('[renderer-auth-route-neutrality-guard] OK')
