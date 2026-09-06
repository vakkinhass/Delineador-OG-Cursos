import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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
    let errors: string[] = []

    // Primeiro, criar/atualizar turmas
    const turmaMap: Record<string, string> = {}
    for (const t of turmasToImport) {
      const existing = await db.turma.findUnique({ where: { name: t.name } })
      if (existing) {
        turmaMap[t.name] = existing.id
      } else {
        const created = await db.turma.create({
          data: { name: t.name, description: t.description || null, active: t.active !== false },
        })
        turmaMap[t.name] = created.id
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

        const existing = await db.user.findUnique({ where: { cpf } })
        if (existing) {
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
            const turma = await db.turma.findUnique({ where: { name: turmaName } })
            if (turma) {
              turmaMap[turmaName] = turma.id
              userTurmaIds.push(turma.id)
            }
          }
        }

        await db.user.create({
          data: {
            cpf,
            name: u.name,
            role: u.role === 'ADMIN' ? 'ADMIN' : 'STUDENT',
            active: u.active !== false,
            turmas: userTurmaIds.length > 0
              ? { create: userTurmaIds.map((turmaId) => ({ turmaId })) }
              : undefined,
          },
        })
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
