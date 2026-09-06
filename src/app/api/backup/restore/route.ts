import { NextRequest, NextResponse } from 'next/server'
import { query, generateId } from '@/lib/db-pg'
import { requireAdmin, maskCpf, sanitizeCpf } from '@/lib/auth'

// POST /api/backup/restore
// Restaura usuários a partir de um JSON de backup.
// Body: { users: [{ cpf, name, role, active, turmas: [name] }], turmas: [...] }
// Não sobrescreve usuários existentes (apenas cria os que não existem).
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const usersToImport: any[] = body.users || []
    const turmasToImport: any[] = body.turmas || []

    let created = 0
    let skipped = 0
    const errors: string[] = []

    // Primeiro, criar/atualizar turmas
    const turmaMap: Record<string, string> = {}
    for (const t of turmasToImport) {
      const existing = await query('SELECT id FROM "Turma" WHERE name = $1', [t.name])
      if (existing.rowCount && existing.rowCount > 0) {
        turmaMap[t.name] = existing.rows[0].id
      } else {
        const newId = generateId()
        await query(
          `INSERT INTO "Turma" (id, name, description, active, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [newId, t.name, t.description || null, t.active !== false]
        )
        turmaMap[t.name] = newId
      }
    }

    // Importar usuários
    for (const u of usersToImport) {
      try {
        const cpf = maskCpf(sanitizeCpf(u.cpf || ''))
        if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
          errors.push(`CPF inválido: ${u.cpf}`)
          continue
        }

        const existing = await query('SELECT id FROM "User" WHERE cpf = $1', [cpf])
        if (existing.rowCount && existing.rowCount > 0) {
          skipped++
          continue
        }

        // Determinar turmas do usuário
        const userTurmaIds: string[] = []
        for (const turmaName of (u.turmas || [])) {
          if (turmaMap[turmaName]) {
            userTurmaIds.push(turmaMap[turmaName])
          } else {
            // Buscar turma existente no banco
            const turmaRes = await query('SELECT id FROM "Turma" WHERE name = $1', [turmaName])
            if (turmaRes.rows.length > 0) {
              turmaMap[turmaName] = turmaRes.rows[0].id
              userTurmaIds.push(turmaRes.rows[0].id)
            }
          }
        }

        const userId = generateId()
        await query(
          `INSERT INTO "User" (id, cpf, name, role, active, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [userId, cpf, u.name, u.role === 'ADMIN' ? 'ADMIN' : 'STUDENT', u.active !== false]
        )

        for (const turmaId of userTurmaIds) {
          await query(
            `INSERT INTO "UserTurma" (id, "userId", "turmaId", "enrolledAt")
             VALUES ($1, $2, $3, NOW())`,
            [generateId(), userId, turmaId]
          )
        }
        created++
      } catch (err: any) {
        errors.push(`Erro ao importar ${u.name || u.cpf}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json({ error: 'Erro ao restaurar backup.' }, { status: 500 })
  }
}
