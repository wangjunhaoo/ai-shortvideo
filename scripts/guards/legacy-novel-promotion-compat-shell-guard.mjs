#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'

const root = process.cwd()
const legacyRoot = path.join(
  root,
  'src',
  'app',
  '[locale]',
  'workspace',
  '[projectId]',
  'modes',
  'novel-promotion',
)
const rendererRoot = path.join(
  root,
  'packages',
  'renderer',
  'modules',
  'project-detail',
  'novel-promotion',
)

function fail(title, details = []) {
  console.error(`\n[legacy-novel-promotion-compat-shell-guard] ${title}`)
  for (const line of details) {
    console.error(`  - ${line}`)
  }
  process.exit(1)
}

function walkFiles(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath))
      continue
    }
    if (entry.isFile()) {
      files.push(fullPath)
    }
  }
  return files
}

function normalize(text) {
  return text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
}

function getRelativePath(fullPath, baseDir) {
  return path.relative(baseDir, fullPath).split(path.sep).join('/')
}

function isUseClientDirective(line) {
  return [
    "'use client'",
    "'use client';",
    '"use client"',
    '"use client";',
  ].includes(line.trim().replace(/^\uFEFF/, ''))
}

function buildExpectedShell(relativePath, rendererContent) {
  if (relativePath.endsWith('.css')) {
    return normalize(rendererContent)
  }

  const firstNonEmptyLine = normalize(rendererContent)
    .split('\n')
    .find((line) => line.trim() !== '')

  if (!firstNonEmptyLine) {
    fail('Renderer compat counterpart is empty', [relativePath])
  }

  const usesClient = isUseClientDirective(firstNonEmptyLine)
  const hasDefaultExport = /export\s+default\s+/.test(rendererContent)
  const modulePath = `@renderer/modules/project-detail/novel-promotion/${relativePath.replace(/\.(tsx|ts|jsx|js)$/, '')}`

  const lines = []
  if (usesClient) {
    lines.push("'use client'", '')
  }
  lines.push(`export * from '${modulePath}'`)
  if (hasDefaultExport) {
    lines.push(`export { default } from '${modulePath}'`)
  }
  return `${lines.join('\n')}\n`
}

if (!fs.existsSync(legacyRoot)) {
  fail('Missing legacy novel-promotion directory', [legacyRoot])
}

if (!fs.existsSync(rendererRoot)) {
  fail('Missing renderer novel-promotion directory', [rendererRoot])
}

const legacyFiles = walkFiles(legacyRoot).filter((file) => {
  const ext = path.extname(file)
  return ['.ts', '.tsx', '.js', '.jsx', '.css'].includes(ext)
})

if (legacyFiles.length === 0) {
  fail('Legacy novel-promotion directory is empty')
}

for (const legacyFile of legacyFiles) {
  const relativePath = getRelativePath(legacyFile, legacyRoot)
  const rendererFile = path.join(rendererRoot, ...relativePath.split('/'))
  if (!fs.existsSync(rendererFile)) {
    fail('Missing renderer compat counterpart', [relativePath])
  }

  const legacyContent = normalize(fs.readFileSync(legacyFile, 'utf8'))
  const rendererContent = fs.readFileSync(rendererFile, 'utf8')
  const expectedContent = buildExpectedShell(relativePath, rendererContent)
  const normalizedLegacy = relativePath.endsWith('.css')
    ? legacyContent.trimEnd()
    : legacyContent
  const normalizedExpected = relativePath.endsWith('.css')
    ? expectedContent.trimEnd()
    : normalize(expectedContent)

  if (normalizedLegacy !== normalizedExpected) {
    fail('Legacy novel-promotion file must stay as a compat shell', [relativePath])
  }
}

console.log('[legacy-novel-promotion-compat-shell-guard] OK')
