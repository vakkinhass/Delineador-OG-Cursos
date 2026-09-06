import { cookies } from 'next/headers'
import { query } from '@/lib/db-pg'

// ============================================================
// SISTEMA DE AUTENTICAÇÃO POR CPF
// Sessão simples baseada em cookie assinado (sem senha)
// ============================================================

const SESSION_COOKIE = 'og_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 dias

export interface SessionUser {
  id: string
  cpf: string
  name: string
  role: 'ADMIN' | 'STUDENT'
  active: boolean
}

/**
 * Limpa e formata o CPF removendo caracteres não numéricos
 */
export function sanitizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Aplica a máscara de CPF: 000.000.000-00
 */
export function maskCpf(cpf: string): string {
  const digits = sanitizeCpf(cpf).slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

/**
 * Validação básica de CPF (11 dígitos)
 */
export function isValidCpfFormat(cpf: string): boolean {
  const digits = sanitizeCpf(cpf)
  return digits.length === 11
}

/**
 * Cria a sessão do usuário (cookie)
 */
export async function createSession(user: SessionUser) {
  const payload = {
    id: user.id,
    cpf: user.cpf,
    name: user.name,
    role: user.role,
    ts: Date.now(),
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

/**
 * Encerra a sessão
 */
export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

/**
 * Obtém o usuário atual da sessão, consultando o banco
 * para garantir que ainda está ativo.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null

    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    if (!decoded?.id) return null

    const res = await query(
      'SELECT id, cpf, name, role, active FROM "User" WHERE id = $1',
      [decoded.id]
    )

    if (res.rows.length === 0) {
      await destroySession()
      return null
    }

    const user = res.rows[0]
    if (!user.active) {
      await destroySession()
      return null
    }

    return {
      id: user.id,
      cpf: user.cpf,
      name: user.name,
      role: user.role,
      active: user.active,
    }
  } catch {
    return null
  }
}

/**
 * Require auth - retorna o usuário ou null
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

/**
 * Require admin - retorna o usuário admin ou lança erro
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role !== 'ADMIN') throw new Error('FORBIDDEN')
  return user
}
