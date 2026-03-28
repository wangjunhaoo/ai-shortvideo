#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'

const root = process.cwd()
const runtimeDir = path.join(root, 'desktop', 'runtime')
const allowedNextBoundaryFile = path.join(runtimeDir, 'next-page-runtime-support.cjs')
const sourceExtensions = new Set(['.js', '.cjs', '.mjs', '.ts', '.tsx'])

function fail(title, details = []) {
  console.error(`\n[desktop-next-page-runtime-boundary-guard] ${title}`)
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
    if (entry.name === 'node_modules' || entry.name === '.next') continue
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

if (!fs.existsSync(allowedNextBoundaryFile)) {
  fail('Missing next page runtime support boundary file', [
    'desktop/runtime/next-page-runtime-support.cjs',
  ])
}

const runtimeFiles = walk(runtimeDir)
const violations = []

for (const file of runtimeFiles) {
  const content = fs.readFileSync(file, 'utf8')
  const relPath = toRel(file)

  const hasDirectNextRuntimeBinding =
    /next\/dist/.test(content)
    || /require\(['"]next['"]\)/.test(content)
    || /\baddRequestMeta\b/.test(content)

  if (file !== allowedNextBoundaryFile && hasDirectNextRuntimeBinding) {
    violations.push(`${relPath} contains forbidden direct Next page runtime binding`)
  }
}

const allowedBoundaryContent = fs.readFileSync(allowedNextBoundaryFile, 'utf8')
if (!/next\/dist\/server\/request-meta/.test(allowedBoundaryContent)) {
  fail('next page runtime support must own request-meta integration', [
    'desktop/runtime/next-page-runtime-support.cjs',
  ])
}

if (!/next\/dist\/server\/node-environment/.test(allowedBoundaryContent)) {
  fail('next page runtime support must own node-environment integration', [
    'desktop/runtime/next-page-runtime-support.cjs',
  ])
}

if (!/require\(['"]next['"]\)/.test(allowedBoundaryContent)) {
  fail('next page runtime support must own packaged next smoke dependency check', [
    'desktop/runtime/next-page-runtime-support.cjs',
  ])
}

if (violations.length > 0) {
  fail('Found direct Next page runtime usage outside next-page-runtime-support.cjs', violations)
}

console.log('[desktop-next-page-runtime-boundary-guard] OK')
