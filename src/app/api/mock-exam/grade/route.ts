import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { AnswerOption, AnswersMap } from '@/lib/types'

// POST /api/mock-exam/grade
// Corrige um simulado livre.
// Body: { answers: { questionId: 'A'|'B'|'C'|'D' }, timeSpentSeconds: number }
// Retorna gabarito comentado, percentual de acertos e estatísticas.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const answers: AnswersMap = body.answers || {}
    const timeSpentSeconds: number = body.timeSpentSeconds || 0

    const questionIds = Object.keys(answers)
    if (questionIds.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma resposta enviada.' },
        { status: 400 }
      )
    }

    // Buscar questões com gabarito
    const questions = await db.question.findMany({
      where: { id: { in: questionIds } },
      include: { subject: { select: { name: true } } },
    })

    let correctCount = 0
    const results = questions.map((q, index) => {
      const userAnswer = answers[q.id] as AnswerOption
      const isCorrect = userAnswer === q.correctAnswer
      if (isCorrect) correctCount++

      return {
        id: q.id,
        index: index + 1,
        subjectName: q.subject.name,
        statement: q.statement,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        userAnswer,
        isCorrect,
        explanation: q.explanation,
      }
    })

    const totalQuestions = questions.length
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0

    // Estatísticas por disciplina
    const bySubject: Record<string, { total: number; correct: number }> = {}
    for (const r of results) {
      if (!bySubject[r.subjectName]) {
        bySubject[r.subjectName] = { total: 0, correct: 0 }
      }
      bySubject[r.subjectName].total++
      if (r.isCorrect) bySubject[r.subjectName].correct++
    }

    return NextResponse.json({
      totalQuestions,
      correctCount,
      wrongCount: totalQuestions - correctCount,
      score: Math.round(score * 100) / 100,
      timeSpentSeconds,
      results,
      bySubject,
    })
  } catch (error) {
    console.error('Mock exam grade error:', error)
    return NextResponse.json(
      { error: 'Erro ao corrigir simulado.' },
      { status: 500 }
    )
  }
}
