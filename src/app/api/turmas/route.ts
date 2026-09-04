import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// GET /api/turmas - Lista turmas com contagem de alunos
export async function GET() {
  const turmas = await db.turma.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { users: true, exams: true } },
    },
  })

  return NextResponse.json({
    turmas: turmas.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      active: t.active,
      studentCount: t._count.users,
      examCount: t._count.exams,
      createdAt: t.createdAt,
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

    const existing = await db.turma.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Já existe uma turma com este nome.' }, { status: 409 })
    }

    const turma = await db.turma.create({ data: { name, description, active } })
    return NextResponse.json({ success: true, turma })
  } catch (error) {
    console.error('Create turma error:', error)
    return NextResponse.json({ error: 'Erro ao criar turma.' }, { status: 500 })
  }
}
