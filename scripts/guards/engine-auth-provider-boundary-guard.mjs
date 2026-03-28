#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import process from 'process'

const root = process.cwd()
const scanRoots = ['packages/engine', 'src/app/api/auth']
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const nextAuthBridgeFile = path.join(root, 'packages', 'engine', 'services', 'next-auth-bridge-service.ts')
const nextAuthTypesFile = path.join(root, 'src', 'types', 'next-auth.d.ts')

function fail(title, details = []) {
  console.error(`\n[engine-auth-provider-boundary-guard] ${title}`)
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
    const usesNextAuthPackage =
      /from\s+['"]next-auth(?:\/|['"])/.test(line)
      || /from\s+['"]@next-auth\/prisma-adapter['"]/.test(line)
      || /require\(['"]next-auth(?:\/|['"])/.test(line)
      || /require\(['"]@next-auth\/prisma-adapter['"]\)/.test(line)
    if (usesNextAuthPackage) {
      violations.push(`${relPath}:${i + 1} forbidden direct next-auth import`)
    }

    if (
      /from\s+['"]@engine\/services\/next-auth-bridge-service['"]/.test(line)
      || /require\(['"]@engine\/services\/next-auth-bridge-service['"]\)/.test(line)
    ) {
      violations.push(`${relPath}:${i + 1} forbidden direct next-auth bridge import`)
    }
  }

  return violations
}

const allFiles = scanRoots.flatMap((scanRoot) => walk(path.join(root, scanRoot)))
const violations = allFiles.flatMap((fullPath) => collectViolations(fullPath))

if (!fs.existsSync(nextAuthBridgeFile)) {
  fail('Missing next-auth bridge retirement stub', ['packages/engine/services/next-auth-bridge-service.ts'])
}

if (!fs.existsSync(nextAuthTypesFile)) {
  fail('Missing next-auth type retirement stub', ['src/types/next-auth.d.ts'])
}

const nextAuthBridgeContent = fs.readFileSync(nextAuthBridgeFile, 'utf8')
if (!/NEXT_AUTH_BRIDGE_REMOVED/.test(nextAuthBridgeContent)) {
  fail('next-auth bridge must stay as retirement stub', [
    'packages/engine/services/next-auth-bridge-service.ts must contain NEXT_AUTH_BRIDGE_REMOVED',
  ])
}

if (
  /from\s+['"]next-auth(?:\/|['"])/.test(nextAuthBridgeContent)
  || /from\s+['"]@next-auth\/prisma-adapter['"]/.test(nextAuthBridgeContent)
  || /require\(['"]next-auth(?:\/|['"])/.test(nextAuthBridgeContent)
  || /require\(['"]@next-auth\/prisma-adapter['"]\)/.test(nextAuthBridgeContent)
) {
  fail('next-auth bridge retirement stub must not import next-auth packages', [
    'packages/engine/services/next-auth-bridge-service.ts',
  ])
}

const nextAuthTypesContent = fs.readFileSync(nextAuthTypesFile, 'utf8')
if (!/next-auth 类型扩展已退场/.test(nextAuthTypesContent) || !/export\s*\{\s*\}/.test(nextAuthTypesContent)) {
  fail('next-auth type stub must stay as explicit retirement marker', [
    'src/types/next-auth.d.ts must keep retirement marker and export {}',
  ])
}

if (/declare\s+module\s+['"]next-auth['"]/.test(nextAuthTypesContent)) {
  fail('next-auth type stub must not restore legacy module augmentation', [
    'src/types/next-auth.d.ts',
  ])
}

if (violations.length > 0) {
  fail('Found forbidden next-auth usage outside provider boundary', violations)
}

console.log('[engine-auth-provider-boundary-guard] OK')
