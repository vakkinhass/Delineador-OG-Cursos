import { NextRequest, NextResponse } from 'next/server'
import { query, generateId } from '@/lib/db-pg'
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
    const existing = await query(
      'SELECT id FROM "User" WHERE cpf = $1 AND id <> $2',
      [cpf, id]
    )
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ error: 'CPF já cadastrado em outro usuário.' }, { status: 409 })
    }

    // Atualizar usuário
    await query(
      `UPDATE "User"
          SET name = $1, cpf = $2, role = $3, active = $4, "updatedAt" = NOW()
        WHERE id = $5`,
      [name, cpf, role, active, id]
    )

    // Remover turmas antigas
    await query('DELETE FROM "UserTurma" WHERE "userId" = $1', [id])

    // Adicionar novas
    if (turmaIds.length > 0) {
      for (const turmaId of turmaIds) {
        await query(
          `INSERT INTO "UserTurma" (id, "userId", "turmaId", "enrolledAt")
           VALUES ($1, $2, $3, NOW())`,
          [generateId(), id, turmaId]
        )
      }
    }

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
    await query('DELETE FROM "User" WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Erro ao remover usuário.' }, { status: 500 })
  }
}
