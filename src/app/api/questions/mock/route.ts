import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { getCurrentUser } from '@/lib/auth'

// GET /api/questions/mock?subjectId=xxx&difficulty=EASY&count=100
// Retorna questões COM gabarito (para visualização no painel admin e geração de simulado).
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subjectId = searchParams.get('subjectId')
  const difficulty = searchParams.get('difficulty') || 'ANY'
  const count = parseInt(searchParams.get('count') || '100', 10)

  const params: any[] = []
  const conditions: string[] = []
  if (subjectId) {
    params.push(subjectId)
    conditions.push(`q."subjectId" = $${params.length}`)
  }
  if (difficulty !== 'ANY') {
    params.push(difficulty)
    conditions.push(`q.difficulty = $${params.length}`)
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const questionsRes = await query(
    `SELECT q.id, q."subjectId" AS subjectid, q.difficulty, q.statement,
            q."optionA", q."optionB", q."optionC", q."optionD",
            q."correctAnswer" AS correctanswer, q.explanation,
            s.name AS "subjectName"
       FROM "Question" q
       LEFT JOIN "Subject" s ON s.id = q."subjectId"
       ${where}
      ORDER BY q."createdAt" ASC
      LIMIT $${params.length + 1}`,
    [...params, count]
  )

  return NextResponse.json({
    questions: questionsRes.rows.map((q, i) => ({
      id: q.id,
      index: i + 1,
      subjectId: q.subjectid,
      subjectName: q.subjectname,
      difficulty: q.difficulty,
      statement: q.statement,
      optionA: q.optiona,
      optionB: q.optionb,
      optionC: q.optionc,
      optionD: q.optiond,
      correctAnswer: q.correctanswer,
      explanation: q.explanation,
    })),
  })
}
