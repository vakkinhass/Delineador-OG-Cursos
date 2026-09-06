import { NextRequest, NextResponse } from 'next/server'
import { query, generateId } from '@/lib/db-pg'
import { requireAdmin, maskCpf, sanitizeCpf } from '@/lib/auth'

// GET /api/users - Lista todos os usuários (Admin)
export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  }

  const usersRes = await query(
    `SELECT id, cpf, name, role, active, "createdAt"
       FROM "User"
      ORDER BY name ASC`
  )

  // Buscar turmas de todos os usuários
  const turmasRes = await query(
    `SELECT ut."userId" AS userid, t.id, t.name
       FROM "UserTurma" ut
       JOIN "Turma" t ON t.id = ut."turmaId"
      ORDER BY t.name ASC`
  )

  const turmasByUser: Record<string, { id: string; name: string }[]> = {}
  for (const row of turmasRes.rows) {
    if (!turmasByUser[row.userid]) turmasByUser[row.userid] = []
    turmasByUser[row.userid].push({ id: row.id, name: row.name })
  }

  return NextResponse.json({
    users: usersRes.rows.map((u) => ({
      id: u.id,
      cpf: u.cpf,
      name: u.name,
      role: u.role,
      active: u.active,
      createdAt: u.createdat,
      turmas: turmasByUser[u.id] || [],
    })),
  })
}

// POST /api/users - Cria novo usuário (Admin)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const rawCpf = String(body.cpf || '').trim()
    const cpf = maskCpf(sanitizeCpf(rawCpf))
    const role = body.role === 'ADMIN' ? 'ADMIN' : 'STUDENT'
    const active = body.active !== false
    const turmaIds: string[] = body.turmaIds || []

    if (!name || !cpf) {
      return NextResponse.json({ error: 'Nome e CPF são obrigatórios.' }, { status: 400 })
    }

    const existing = await query('SELECT id FROM "User" WHERE cpf = $1', [cpf])
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ error: 'CPF já cadastrado.' }, { status: 409 })
    }

    const id = generateId()
    await query(
      `INSERT INTO "User" (id, cpf, name, role, active, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [id, cpf, name, role, active]
    )

    if (turmaIds.length > 0) {
      const insertTurmaPromises = turmaIds.map((turmaId) =>
        query(
          `INSERT INTO "UserTurma" (id, "userId", "turmaId", "enrolledAt")
           VALUES ($1, $2, $3, NOW())`,
          [generateId(), id, turmaId]
        )
      )
      await Promise.all(insertTurmaPromises)
    }

    return NextResponse.json({
      success: true,
      user: { id, cpf, name, role, active },
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Erro ao criar usuário.' }, { status: 500 })
  }
}
