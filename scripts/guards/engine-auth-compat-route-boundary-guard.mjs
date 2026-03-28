#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'

const root = process.cwd()
const scanRoots = ['packages/engine', 'src/app/api/auth']
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const compatImportPattern =
  /from\s+['"]@engine\/services\/auth-compat-route-service['"]|require\(['"]@engine\/services\/auth-compat-route-service['"]\)/

function fail(title, details = []) {
  console.error(`\n[engine-auth-compat-route-boundary-guard] ${title}`)
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

const allFiles = scanRoots.flatMap((scanRoot) => walk(path.join(root, scanRoot)))
const violations = []

for (const fullPath of allFiles) {
  const relPath = toRel(fullPath)
  const content = fs.readFileSync(fullPath, 'utf8')
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i += 1) {
    if (!compatImportPattern.test(lines[i])) continue
    violations.push(`${relPath}:${i + 1} forbidden auth compat route import`)
  }
}

if (violations.length > 0) {
  fail('Found forbidden auth compat route import after compat removal', violations)
}

console.log('[engine-auth-compat-route-boundary-guard] OK')
