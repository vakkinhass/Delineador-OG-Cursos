import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// PUT /api/turmas/[id] - Atualiza turma (Admin)
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
    const description = body.description ? String(body.description) : null
    const active = body.active !== false

    if (!name) {
      return NextResponse.json({ error: 'Nome da turma é obrigatório.' }, { status: 400 })
    }

    const existing = await db.turma.findFirst({
      where: { name, NOT: { id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Já existe uma turma com este nome.' }, { status: 409 })
    }

    await db.turma.update({ where: { id }, data: { name, description, active } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update turma error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar turma.' }, { status: 500 })
  }
}

// DELETE /api/turmas/[id] - Remove turma (Admin)
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
    await db.turma.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete turma error:', error)
    return NextResponse.json({ error: 'Erro ao remover turma. Verifique se não há dependências.' }, { status: 500 })
  }
}
