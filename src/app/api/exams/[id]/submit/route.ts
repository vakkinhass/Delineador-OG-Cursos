import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST /api/exams/[id]/submit
// Submete a prova: corrige, calcula score e salva resultado.
// Body: { answers: { questionId: 'A'|'B'|'C'|'D' }, autoSubmitted?: boolean }
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
    const autoSubmitted = body.autoSubmitted === true

    const result = await db.examResult.findUnique({
      where: { examId_userId: { examId: id, userId: user.id } },
    })

    if (!result) {
      return NextResponse.json({ error: 'Prova não iniciada.' }, { status: 400 })
    }

    if (result.status === 'SUBMITTED' || result.status === 'AUTO_SUBMITTED') {
      return NextResponse.json({ error: 'Prova já finalizada.', resultId: result.id }, { status: 400 })
    }

    // Buscar questões da prova com gabarito
    const examQuestions = await db.examQuestion.findMany({
      where: { examId: id },
      include: { question: true },
      orderBy: { order: 'asc' },
    })

    // Mesclar respostas salvas com as enviadas (as enviadas têm prioridade)
    const savedAnswers = result.answers ? JSON.parse(result.answers) : {}
    const finalAnswers = { ...savedAnswers, ...answers }

    let correctCount = 0
    for (const eq of examQuestions) {
      const userAnswer = finalAnswers[eq.questionId]
      if (userAnswer && userAnswer === eq.question.correctAnswer) {
        correctCount++
      }
    }

    const totalQuestions = examQuestions.length
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0

    // Calcular tempo gasto
    const now = new Date()
    const startedAt = result.startedAt || now
    const timeSpentSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000)

    const updated = await db.examResult.update({
      where: { id: result.id },
      data: {
        answers: JSON.stringify(finalAnswers),
        score: Math.round(score * 100) / 100,
        correctCount,
        totalQuestions,
        timeSpentSeconds,
        status: autoSubmitted ? 'AUTO_SUBMITTED' : 'SUBMITTED',
        submittedAt: now,
      },
    })

    return NextResponse.json({
      success: true,
      resultId: updated.id,
      score: updated.score,
      correctCount: updated.correctCount,
      totalQuestions: updated.totalQuestions,
      timeSpentSeconds: updated.timeSpentSeconds,
      status: updated.status,
      autoSubmitted,
    })
  } catch (error) {
    console.error('Submit exam error:', error)
    return NextResponse.json({ error: 'Erro ao submeter prova.' }, { status: 500 })
  }
}
