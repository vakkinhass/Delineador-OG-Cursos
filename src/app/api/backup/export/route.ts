import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// GET /api/backup/export
// Exporta todos os usuários (alunos) em JSON para backup.
export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  }

  const users = await db.user.findMany({
    orderBy: { name: 'asc' },
    include: {
      turmas: { include: { turma: { select: { id: true, name: true } } } },
    },
  })

  const turmas = await db.turma.findMany({ orderBy: { name: 'asc' } })

  const backup = {
    exportedAt: new Date().toISOString(),
    version: 1,
    turmas: turmas.map((t) => ({ id: t.id, name: t.name, description: t.description, active: t.active })),
    users: users.map((u) => ({
      cpf: u.cpf,
      name: u.name,
      role: u.role,
      active: u.active,
      turmas: u.turmas.map((ut) => ut.turma.name),
    })),
  }

  return NextResponse.json(backup, {
    headers: {
      'Content-Disposition': `attachment; filename="backup-ocean-green-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
