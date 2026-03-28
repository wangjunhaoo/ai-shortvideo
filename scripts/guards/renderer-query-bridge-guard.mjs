#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'

const root = process.cwd()
const scanRoot = 'packages/renderer'
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const allowedFiles = new Set([
  'packages/renderer/hooks/useRendererProjectQueries.ts',
  'packages/renderer/hooks/useRendererSse.ts',
  'packages/renderer/hooks/useRendererTaskTargetStateMap.ts',
  'packages/renderer/modules/asset-hub/hooks/useAssetHubOperations.ts',
  'packages/renderer/modules/asset-hub/hooks/useAssetHubMutations.ts',
  'packages/renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionOperations.ts',
  'packages/renderer/modules/project-detail/novel-promotion/hooks/useRendererNovelPromotionRuntimeHooks.ts',
])

function fail(title, details = []) {
  console.error(`\n[renderer-query-bridge-guard] ${title}`)
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
  if (allowedFiles.has(relPath)) return []

  const content = fs.readFileSync(fullPath, 'utf8')
  const lines = content.split('\n')
  const violations = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (/from\s+['"]@\/lib\/query\/(?:hooks|mutations)(?:\/|['"])/.test(line)) {
      violations.push(`${relPath}:${i + 1} forbidden direct query hooks/mutations import`)
    }
    if (/from\s+['"]next-auth\/react['"]/.test(line) || /require\(['"]next-auth\/react['"]\)/.test(line)) {
      violations.push(`${relPath}:${i + 1} forbidden next-auth/react import`)
    }
  }

  return violations
}

const allFiles = walk(path.join(root, scanRoot))
const violations = allFiles.flatMap((fullPath) => collectViolations(fullPath))

if (violations.length > 0) {
  fail('Found forbidden direct query or next-auth/react import in packages/renderer', violations)
}

console.log('[renderer-query-bridge-guard] OK')
