import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, maskCpf, sanitizeCpf } from '@/lib/auth'

// GET /api/users - Lista todos os usuários (Admin)
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

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      cpf: u.cpf,
      name: u.name,
      role: u.role,
      active: u.active,
      createdAt: u.createdAt,
      turmas: u.turmas.map((t) => ({ id: t.turma.id, name: t.turma.name })),
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

    const existing = await db.user.findUnique({ where: { cpf } })
    if (existing) {
      return NextResponse.json({ error: 'CPF já cadastrado.' }, { status: 409 })
    }

    const user = await db.user.create({
      data: {
        name,
        cpf,
        role,
        active,
        turmas: turmaIds.length > 0
          ? { create: turmaIds.map((turmaId) => ({ turmaId })) }
          : undefined,
      },
      include: { turmas: { include: { turma: true } } },
    })

    return NextResponse.json({ success: true, user: { id: user.id, cpf: user.cpf, name: user.name, role: user.role, active: user.active } })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Erro ao criar usuário.' }, { status: 500 })
  }
}
