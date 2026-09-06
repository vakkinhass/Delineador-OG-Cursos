import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
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

    const existing = await query(
      'SELECT id FROM "Turma" WHERE name = $1 AND id <> $2',
      [name, id]
    )
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ error: 'Já existe uma turma com este nome.' }, { status: 409 })
    }

    await query(
      `UPDATE "Turma"
          SET name = $1, description = $2, active = $3, "updatedAt" = NOW()
        WHERE id = $4`,
      [name, description, active, id]
    )
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
    await query('DELETE FROM "Turma" WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete turma error:', error)
    return NextResponse.json({ error: 'Erro ao remover turma. Verifique se não há dependências.' }, { status: 500 })
  }
}
