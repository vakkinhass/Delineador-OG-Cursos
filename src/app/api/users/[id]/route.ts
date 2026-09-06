import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, maskCpf, sanitizeCpf } from '@/lib/auth'

// PUT /api/users/[id] - Atualiza usuário (Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  }

  const { id } = await params

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

    // Verificar CPF duplicado
    const existing = await db.user.findFirst({
      where: { cpf, NOT: { id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'CPF já cadastrado em outro usuário.' }, { status: 409 })
    }

    // Atualizar usuário e turmas (transação)
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { name, cpf, role, active },
      })
      // Remover turmas antigas
      await tx.userTurma.deleteMany({ where: { userId: id } })
      // Adicionar novas
      if (turmaIds.length > 0) {
        await tx.userTurma.createMany({
          data: turmaIds.map((turmaId) => ({ userId: id, turmaId })),
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar usuário.' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Remove usuário (Admin)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  }

  const { id } = await params

  try {
    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Erro ao remover usuário.' }, { status: 500 })
  }
}
