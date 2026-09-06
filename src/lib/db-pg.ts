import { Pool } from 'pg'

// ============================================================
// CAMADA DE ACESSO AO BANCO (Supabase PostgreSQL via pg)
// Usa pg diretamente - mais leve e confiavel em serverless (Netlify)
// ============================================================

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://postgres.xwlaedcdeyxpxywbdbus:Skopek231165@aws-0-sa-east-1.pooler.supabase.com:6543/postgres'

// Pool de conexões (reutilizado entre invocações serverless)
let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
      ssl: false,
    })
  }
  return pool
}

export async function query(text: string, params?: any[]) {
  const client = await getPool().connect()
  try {
    const res = await client.query(text, params)
    return res
  } finally {
    client.release()
  }
}

// ============================================================
// HELPERS - Gerar IDs tipo cuid
// ============================================================
export function generateId(): string {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).substring(2, 14)
}

// ============================================================
// TIPOS
// ============================================================
export interface UserRow {
  id: string
  cpf: string
  name: string
  role: string
  active: boolean
  createdat: Date
  updatedat: Date
}

export interface TurmaRow {
  id: string
  name: string
  description: string | null
  active: boolean
}

export interface SubjectRow {
  id: string
  name: string
  description: string | null
}

export interface QuestionRow {
  id: string
  subjectid: string
  difficulty: string
  statement: string
  optiona: string
  optionb: string
  optionc: string
  optiond: string
  correctanswer: string
  explanation: string | null
}

export interface ExamRow {
  id: string
  title: string
  description: string | null
  turmaid: string | null
  subjectid: string | null
  startdatetime: Date
  enddatetime: Date
  durationminutes: number
  active: boolean
  isrecovery: boolean
  recoveryforexamid: string | null
}

export interface ExamResultRow {
  id: string
  examid: string
  userid: string
  answers: string
  score: number
  correctcount: number
  totalquestions: number
  timespentseconds: number
  startedat: Date | null
  submittedat: Date | null
  status: string
}
