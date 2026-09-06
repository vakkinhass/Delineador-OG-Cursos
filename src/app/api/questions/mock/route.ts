import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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

  const where: { subjectId?: string; difficulty?: string } = {}
  if (subjectId) where.subjectId = subjectId
  if (difficulty !== 'ANY') where.difficulty = difficulty

  const questions = await db.question.findMany({
    where,
    include: { subject: { select: { name: true } } },
    take: count,
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    questions: questions.map((q, i) => ({
      id: q.id,
      index: i + 1,
      subjectId: q.subjectId,
      subjectName: q.subject.name,
      difficulty: q.difficulty,
      statement: q.statement,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    })),
  })
}
