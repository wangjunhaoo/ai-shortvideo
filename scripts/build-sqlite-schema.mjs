import fs from 'node:fs/promises'
import path from 'node:path'

const SOURCE_SCHEMA_PATH = path.join(process.cwd(), 'prisma', 'schema.prisma')
const TARGET_SCHEMA_PATH = path.join(process.cwd(), 'prisma', 'schema.sqlite.prisma')

function toSqliteDatasource(content) {
  return content.replace(
    /datasource\s+db\s*\{[\s\S]*?\}/m,
    `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`,
  )
}

function stripMysqlNativeTypes(content) {
  // SQLite schema 中不支持 MySQL 的 @db.* 原生类型注解。
  return content.replace(/\s@db\.[A-Za-z0-9_]+(?:\([^)]*\))?/g, '')
}

function buildHeader() {
  const now = new Date().toISOString()
  return `// 该文件由 scripts/build-sqlite-schema.mjs 自动生成。\n// 生成时间: ${now}\n// 请勿手动编辑，修改请更新 prisma/schema.prisma 后重新生成。\n\n`
}

async function main() {
  const source = await fs.readFile(SOURCE_SCHEMA_PATH, 'utf8')
  const converted = stripMysqlNativeTypes(toSqliteDatasource(source))
  const output = `${buildHeader()}${converted}`
  await fs.writeFile(TARGET_SCHEMA_PATH, output, 'utf8')
  console.log(`[desktop] 已生成 SQLite schema: ${TARGET_SCHEMA_PATH}`)
}

main().catch((error) => {
  console.error('[desktop] 生成 SQLite schema 失败')
  console.error(error)
  process.exit(1)
})
