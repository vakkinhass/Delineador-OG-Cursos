import { NextRequest, NextResponse } from 'next/server'
import { query, generateId } from '@/lib/db-pg'
import { requireAdmin, maskCpf, sanitizeCpf } from '@/lib/auth'

// POST /api/users/bulk-import
// Cadastra múltiplos alunos de uma vez.
// Body: { turmaId?: string, students: [{ name, cpf }] }
// Retorna: { created, skipped, errors }
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const students: any[] = body.students || []
    const turmaId: string | undefined = body.turmaId

    let created = 0
    let skipped = 0
    const errors: string[] = []

    for (const s of students) {
      try {
        const name = String(s.name || '').trim()
        const rawCpf = String(s.cpf || '').trim()
        const cpf = maskCpf(sanitizeCpf(rawCpf))

        if (!name) {
          errors.push(`Nome vazio para CPF ${rawCpf}`)
          continue
        }
        if (cpf.replace(/\D/g, '').length !== 11) {
          errors.push(`CPF inválido: ${rawCpf} (${name})`)
          continue
        }

        const existing = await query('SELECT id FROM "User" WHERE cpf = $1', [cpf])
        if (existing.rowCount && existing.rowCount > 0) {
          skipped++
          continue
        }

        const id = generateId()
        await query(
          `INSERT INTO "User" (id, cpf, name, role, active, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, 'STUDENT', true, NOW(), NOW())`,
          [id, cpf, name]
        )

        if (turmaId) {
          await query(
            `INSERT INTO "UserTurma" (id, "userId", "turmaId", "enrolledAt")
             VALUES ($1, $2, $3, NOW())`,
            [generateId(), id, turmaId]
          )
        }
        created++
      } catch (err: any) {
        errors.push(`Erro: ${s.name || s.cpf} - ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json({ error: 'Erro na importação em massa.' }, { status: 500 })
  }
}
