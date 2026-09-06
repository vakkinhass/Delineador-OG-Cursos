import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { getCurrentUser } from '@/lib/auth'

// POST /api/exams/[id]/save
// Auto-save das respostas (a cada clique do aluno).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const answers = body.answers || {}

    const existingRes = await query(
      `SELECT id, status
         FROM "ExamResult"
        WHERE "examId" = $1 AND "userId" = $2`,
      [id, user.id]
    )
    const existing = existingRes.rows[0]

    if (!existing) {
      return NextResponse.json({ error: 'Prova não iniciada.' }, { status: 400 })
    }

    if (existing.status === 'SUBMITTED' || existing.status === 'AUTO_SUBMITTED') {
      return NextResponse.json({ error: 'Prova já finalizada.' }, { status: 400 })
    }

    await query(
      `UPDATE "ExamResult"
          SET answers = $1, "updatedAt" = NOW()
        WHERE id = $2`,
      [JSON.stringify(answers), existing.id]
    )

    return NextResponse.json({ success: true, savedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Save exam error:', error)
    return NextResponse.json({ error: 'Erro ao salvar respostas.' }, { status: 500 })
  }
}
