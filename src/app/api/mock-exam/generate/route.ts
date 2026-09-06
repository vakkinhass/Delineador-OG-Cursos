import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { getCurrentUser } from '@/lib/auth'

// POST /api/mock-exam/generate
// Gera um simulado livre sob demanda.
// Body: { subjectIds?: string[], difficulty?: 'EASY'|'MEDIUM'|'HARD'|'ANY', count?: number }
// Retorna as questões SEM o gabarito (correctAnswer) para o aluno responder.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const subjectIds: string[] = body.subjectIds || []
    const difficulty: string = body.difficulty || 'EASY'
    const count: number = Math.min(Math.max(body.count || 10, 1), 50)

    // Construir filtros
    const params: any[] = []
    const conditions: string[] = []
    if (subjectIds.length > 0) {
      params.push(subjectIds)
      conditions.push(`q."subjectId" = ANY($${params.length}::text[])`)
    }
    if (difficulty !== 'ANY') {
      params.push(difficulty)
      conditions.push(`q.difficulty = $${params.length}`)
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Buscar questões (buscamos mais do que o necessário para embaralhar)
    const allQuestionsRes = await query(
      `SELECT q.id, q."subjectId" AS subjectid, q.difficulty, q.statement,
              q."optionA" AS optiona, q."optionB" AS optionb,
              q."optionC" AS optionc, q."optionD" AS optiond,
              s.name AS subjectname
         FROM "Question" q
         LEFT JOIN "Subject" s ON s.id = q."subjectId"
         ${where}
        ORDER BY q.id ASC`,
      params
    )

    if (allQuestionsRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma questão encontrada com os filtros selecionados.' },
        { status: 404 }
      )
    }

    // Embaralhar (Fisher-Yates) e selecionar
    const shuffled = [...allQuestionsRes.rows]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    const selected = shuffled.slice(0, Math.min(count, shuffled.length))

    // Retornar SEM o gabarito
    const questions = selected.map((q, index) => ({
      id: q.id,
      index: index + 1,
      subjectId: q.subjectid,
      subjectName: q.subjectname,
      difficulty: q.difficulty,
      statement: q.statement,
      optionA: q.optiona,
      optionB: q.optionb,
      optionC: q.optionc,
      optionD: q.optiond,
    }))

    return NextResponse.json({
      examId: `mock-${Date.now()}`,
      questions,
      totalQuestions: questions.length,
    })
  } catch (error) {
    console.error('Mock exam generate error:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar simulado.' },
      { status: 500 }
    )
  }
}
