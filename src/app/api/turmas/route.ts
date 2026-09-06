import { NextRequest, NextResponse } from 'next/server'
import { query, generateId } from '@/lib/db-pg'
import { requireAdmin } from '@/lib/auth'

// GET /api/turmas - Lista turmas com contagem de alunos
export async function GET() {
  const turmasRes = await query(
    `SELECT id, name, description, active, "createdAt"
       FROM "Turma"
      ORDER BY name ASC`
  )

  // Contar alunos por turma
  const studentCountRes = await query(
    `SELECT "turmaId" AS turmaid, COUNT(*)::int AS count
       FROM "UserTurma"
      GROUP BY "turmaId"`
  )
  const studentCount: Record<string, number> = {}
  for (const row of studentCountRes.rows) {
    studentCount[row.turmaid] = row.count
  }

  // Contar provas por turma
  const examCountRes = await query(
    `SELECT "turmaId" AS turmaid, COUNT(*)::int AS count
       FROM "Exam"
      WHERE "turmaId" IS NOT NULL
      GROUP BY "turmaId"`
  )
  const examCount: Record<string, number> = {}
  for (const row of examCountRes.rows) {
    examCount[row.turmaid] = row.count
  }

  return NextResponse.json({
    turmas: turmasRes.rows.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      active: t.active,
      studentCount: studentCount[t.id] || 0,
      examCount: examCount[t.id] || 0,
      createdAt: t.createdat,
    })),
  })
}

// POST /api/turmas - Cria nova turma (Admin)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const description = body.description ? String(body.description) : null
    const active = body.active !== false

    if (!name) {
      return NextResponse.json({ error: 'Nome da turma é obrigatório.' }, { status: 400 })
    }

    const existing = await query('SELECT id FROM "Turma" WHERE name = $1', [name])
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ error: 'Já existe uma turma com este nome.' }, { status: 409 })
    }

    const id = generateId()
    await query(
      `INSERT INTO "Turma" (id, name, description, active, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [id, name, description, active]
    )

    const turma = (await query('SELECT id, name, description, active FROM "Turma" WHERE id = $1', [id])).rows[0]
    return NextResponse.json({ success: true, turma })
  } catch (error) {
    console.error('Create turma error:', error)
    return NextResponse.json({ error: 'Erro ao criar turma.' }, { status: 500 })
  }
}
