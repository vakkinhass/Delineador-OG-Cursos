import { PrismaClient } from '@prisma/client'

// URL do banco Supabase (connection pooler - porta 6543)
// Definida diretamente para evitar problemas de parsing do .env com caracteres especiais
const SUPABASE_DATABASE_URL = 'postgresql://postgres.xwlaedcdeyxpxywbdbus:Skopek231165@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || SUPABASE_DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
