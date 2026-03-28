#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'

const root = process.cwd()
const legacyRootRel = 'src/app/[locale]/workspace/[projectId]/modes/novel-promotion'
const legacyRoot = path.join(root, legacyRootRel)
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])

function fail(title, details = []) {
  console.error(`\n[legacy-novel-promotion-boundary-guard] ${title}`)
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
    if (
      entry.name === '.git'
      || entry.name === '.next'
      || entry.name === 'node_modules'
      || entry.name === 'dist'
    ) continue
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
  if (relPath === 'scripts/guards/legacy-novel-promotion-boundary-guard.mjs') {
    return []
  }
  if (relPath.startsWith(`${legacyRootRel}/`)) {
    return []
  }

  const content = fs.readFileSync(fullPath, 'utf8')
  const lines = content.split('\n')
  const violations = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (
      /modes\/novel-promotion/.test(line)
      || /modes\\novel-promotion/.test(line)
    ) {
      violations.push(`${relPath}:${i + 1} forbidden legacy novel-promotion import/reference`)
    }
  }

  return violations
}

if (!fs.existsSync(legacyRoot)) {
  fail(`Missing legacy root: ${legacyRootRel}`)
}

const allFiles = walk(root)
const violations = allFiles.flatMap((fullPath) => collectViolations(fullPath))

if (violations.length > 0) {
  fail('Found references to legacy src/app novel-promotion tree outside the compat directory', violations)
}

console.log('[legacy-novel-promotion-boundary-guard] OK')
