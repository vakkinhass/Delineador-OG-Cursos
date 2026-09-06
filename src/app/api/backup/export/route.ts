import { NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { requireAdmin } from '@/lib/auth'

// GET /api/backup/export
// Exporta todos os usuários (alunos) em JSON para backup.
export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  }

  const usersRes = await query(
    `SELECT u.id, u.cpf, u.name, u.role, u.active
       FROM "User" u
      ORDER BY u.name ASC`
  )

  const turmasRes = await query(
    `SELECT id, name, description, active FROM "Turma" ORDER BY name ASC`
  )

  // Buscar turmas de cada usuário
  const userTurmasRes = await query(
    `SELECT ut."userId" AS userid, t.name
       FROM "UserTurma" ut
       JOIN "Turma" t ON t.id = ut."turmaId"
      ORDER BY t.name ASC`
  )
  const turmasByUser: Record<string, string[]> = {}
  for (const row of userTurmasRes.rows) {
    if (!turmasByUser[row.userid]) turmasByUser[row.userid] = []
    turmasByUser[row.userid].push(row.name)
  }

  const backup = {
    exportedAt: new Date().toISOString(),
    version: 1,
    turmas: turmasRes.rows.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      active: t.active,
    })),
    users: usersRes.rows.map((u) => ({
      cpf: u.cpf,
      name: u.name,
      role: u.role,
      active: u.active,
      turmas: turmasByUser[u.id] || [],
    })),
  }

  return NextResponse.json(backup, {
    headers: {
      'Content-Disposition': `attachment; filename="backup-ocean-green-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
