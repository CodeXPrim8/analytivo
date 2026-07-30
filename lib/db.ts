import { PrismaClient } from '@prisma/client'
import { INIT_SQL } from '@/lib/schema-sql'

function resolveDatabaseUrl() {
  // On Vercel only /tmp is writable — never use relative file:./dev.db there
  if (process.env.VERCEL) {
    const configured = process.env.DATABASE_URL
    if (configured?.includes('/tmp/')) return configured
    return 'file:/tmp/analytivo.db'
  }
  return process.env.DATABASE_URL || 'file:./prisma/dev.db'
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
  try {
    await prisma.$queryRaw`SELECT 1 FROM User LIMIT 1`
    return
  } catch {
    // Schema missing — create it
  }

  const statements = INIT_SQL.split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement)
  }
}

export async function ensureDatabase() {
  if (!globalForPrisma.dbReady) {
    globalForPrisma.dbReady = applySchema().catch((err) => {
      globalForPrisma.dbReady = undefined
      console.error('[db] ensureDatabase failed', err)
      throw err
    })
  }
  await globalForPrisma.dbReady
}
