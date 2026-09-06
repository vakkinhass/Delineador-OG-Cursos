import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/exams/[id]/result
// Retorna o resultado da prova com gabarito comentado.
// Aluno vê apenas o seu resultado. Admin vê qualquer resultado (opcional ?userId=).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const targetUserId = user.role === 'ADMIN' ? (searchParams.get('userId') || user.id) : user.id

  const result = await db.examResult.findUnique({
    where: { examId_userId: { examId: id, userId: targetUserId } },
    include: {
      exam: {
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: { question: { include: { subject: { select: { name: true } } } } },
          },
        },
      },
      user: { select: { id: true, name: true, cpf: true } },
    },
  })

  if (!result) {
    return NextResponse.json({ error: 'Resultado não encontrado.' }, { status: 404 })
  }

  const answers = result.answers ? JSON.parse(result.answers) : {}

  return NextResponse.json({
    result: {
      id: result.id,
      examId: result.examId,
      examTitle: result.exam.title,
      userName: result.user.name,
      userCpf: result.user.cpf,
      score: result.score,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      timeSpentSeconds: result.timeSpentSeconds,
      status: result.status,
      startedAt: result.startedAt?.toISOString() || null,
      submittedAt: result.submittedAt?.toISOString() || null,
    },
    questions: result.exam.questions.map((eq, index) => {
      const userAnswer = answers[eq.questionId] || null
      return {
        id: eq.question.id,
        index: index + 1,
        subjectName: eq.question.subject.name,
        statement: eq.question.statement,
        optionA: eq.question.optionA,
        optionB: eq.question.optionB,
        optionC: eq.question.optionC,
        optionD: eq.question.optionD,
        correctAnswer: eq.question.correctAnswer,
        userAnswer,
        isCorrect: userAnswer === eq.question.correctAnswer,
        explanation: eq.question.explanation,
      }
    }),
  })
}
