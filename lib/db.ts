import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  // Vercel serverless filesystem is read-only except /tmp
  if (process.env.VERCEL) {
    return 'file:/tmp/analytivo.db'
  }
  return 'file:./dev.db'
}

process.env.DATABASE_URL = resolveDatabaseUrl()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbReady: Promise<void> | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL) {
  globalForPrisma.prisma = prisma
}

async function applySchema() {
  // Cheap existence check
  try {
    await prisma.$queryRaw`SELECT 1 FROM User LIMIT 1`
    return
  } catch {
    // continue to create schema
  }

  const migrationPath = path.join(
    process.cwd(),
    'prisma',
    'migrations',
    '20260730051509_init',
    'migration.sql',
  )

  if (!fs.existsSync(migrationPath)) {
    throw new Error('Database migration file missing')
  }

  const sql = fs.readFileSync(migrationPath, 'utf8')
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement)
  }
}

export async function ensureDatabase() {
  if (!globalForPrisma.dbReady) {
    globalForPrisma.dbReady = applySchema().catch((err) => {
      globalForPrisma.dbReady = undefined
      throw err
    })
  }
  await globalForPrisma.dbReady
}
