#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'

const root = process.cwd()
const scanRoot = 'src/app/api'
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])

const bannedLinePatterns = [
  { regex: /from ['"]@engine\/api-auth['"]/, message: 'route 不得直接 import @engine/api-auth' },
  { regex: /from ['"]@\/lib\/prisma['"]/, message: 'route 不得直接 import prisma' },
  { regex: /from ['"]@\/lib\/storage(?:['"]|\/)/, message: 'route 不得直接 import storage 实现' },
  { regex: /from ['"]@\/lib\/task\/resolve-locale['"]/, message: 'route 不得直接 import locale 解析实现' },
  { regex: /from ['"]@\/lib\/task\/service['"]/, message: 'route 不得直接 import task service' },
  { regex: /from ['"]@\/lib\/run-runtime\//, message: 'route 不得直接 import run-runtime 实现' },
  { regex: /from ['"]@\/lib\/assistant-platform['"]/, message: 'route 不得直接 import assistant platform 实现' },
  { regex: /from ['"]@\/lib\/logging\/file-writer['"]/, message: 'route 不得直接 import 日志文件实现' },
  { regex: /maybeSubmitLLMTask/, message: 'route 不得直接调用 maybeSubmitLLMTask' },
  { regex: /require(Project|User)Auth|isErrorResponse/, message: 'route 不得直接处理鉴权编排' },
  { regex: /getSignedUrl|toFetchableUrl|deleteObject/, message: 'route 不得直接处理存储细节' },
  { regex: /createAssistantChatResponse|retryRunStep|readAllLogs|resolveRequiredTaskLocale/, message: 'route 不得直接处理业务编排实现' },
]

function fail(title, details = []) {
  console.error(`\n[app-api-route-thinness-guard] ${title}`)
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
    for (const rule of bannedLinePatterns) {
      if (rule.regex.test(line)) {
        violations.push(`${relPath}:${i + 1} ${rule.message}`)
      }
    }

    const engineServiceImport = line.match(/from ['"](@engine\/services\/[^'"]+)['"]/)?.[1]
    if (
      engineServiceImport
      && !/route-service|media-route-service|compat-route-service|auth-provider-service/.test(engineServiceImport)
    ) {
      violations.push(`${relPath}:${i + 1} route 只能 import *route-service`)
    }
  }

  return violations
}

const allFiles = walk(path.join(root, scanRoot))
const violations = allFiles.flatMap((fullPath) => collectViolations(fullPath))

if (violations.length > 0) {
  fail('Found non-thin route logic under src/app/api', violations)
}

console.log('[app-api-route-thinness-guard] OK')
