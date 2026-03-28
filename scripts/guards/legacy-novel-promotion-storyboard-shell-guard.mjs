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
  'components',
  'storyboard',
)
const rendererRoot = path.join(
  root,
  'packages',
  'renderer',
  'modules',
  'project-detail',
  'novel-promotion',
  'components',
  'storyboard',
)

function fail(title, details = []) {
  console.error(`\n[legacy-novel-promotion-storyboard-shell-guard] ${title}`)
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
  if (relativePath === 'ImageSection.css') {
    return normalize(rendererContent)
  }

  const firstNonEmptyLine = normalize(rendererContent)
    .split('\n')
    .find((line) => line.trim() !== '')

  if (!firstNonEmptyLine) {
    fail('Renderer storyboard file is empty', [relativePath])
  }

  const usesClient = isUseClientDirective(firstNonEmptyLine)
  const hasDefaultExport = /export\s+default\s+/.test(rendererContent)
  const modulePath = `@renderer/modules/project-detail/novel-promotion/components/storyboard/${relativePath.replace(/\.(tsx|ts)$/, '')}`

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
  fail('Missing legacy storyboard directory', [legacyRoot])
}

if (!fs.existsSync(rendererRoot)) {
  fail('Missing renderer storyboard directory', [rendererRoot])
}

const legacyFiles = walkFiles(legacyRoot)
if (legacyFiles.length === 0) {
  fail('Legacy storyboard directory is empty')
}

for (const legacyFile of legacyFiles) {
  const relativePath = getRelativePath(legacyFile, legacyRoot)
  const rendererFile = path.join(rendererRoot, ...relativePath.split('/'))
  if (!fs.existsSync(rendererFile)) {
    fail('Missing renderer storyboard counterpart', [relativePath])
  }

  const legacyContent = normalize(fs.readFileSync(legacyFile, 'utf8'))
  const rendererContent = fs.readFileSync(rendererFile, 'utf8')
  const expectedContent = buildExpectedShell(relativePath, rendererContent)

  const normalizedLegacy = relativePath === 'ImageSection.css'
    ? legacyContent.trimEnd()
    : legacyContent
  const normalizedExpected = relativePath === 'ImageSection.css'
    ? expectedContent.trimEnd()
    : normalize(expectedContent)

  if (normalizedLegacy !== normalizedExpected) {
    fail('Legacy storyboard file must stay as a thin renderer re-export', [relativePath])
  }
}

console.log('[legacy-novel-promotion-storyboard-shell-guard] OK')
