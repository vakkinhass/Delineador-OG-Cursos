import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Nota de corte da escola: 6,0 (60%)
const NOTA_CORTE = 60

// POST /api/exams/[id]/submit
// Submete a prova: corrige, calcula score e salva resultado.
// Se a nota for < 6.0 (60%) e a prova NÃO for recuperação,
// libera automaticamente uma prova de recuperação para o aluno.
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

    // Buscar a prova para verificar se é de recuperação
    const exam = await db.exam.findUnique({
      where: { id },
      select: { isRecovery: true, recoveryForExamId: true, title: true, durationMinutes: true, subjectId: true },
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
    const roundedScore = Math.round(score * 100) / 100

    // Calcular tempo gasto
    const now = new Date()
    const startedAt = result.startedAt || now
    const timeSpentSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000)

    const updated = await db.examResult.update({
      where: { id: result.id },
      data: {
        answers: JSON.stringify(finalAnswers),
        score: roundedScore,
        correctCount,
        totalQuestions,
        timeSpentSeconds,
        status: autoSubmitted ? 'AUTO_SUBMITTED' : 'SUBMITTED',
        submittedAt: now,
      },
    })

    // ============================================================
    // LÓGICA DE RECUPERAÇÃO AUTOMÁTICA
    // Se nota < 6.0 (60%) e NÃO é prova de recuperação, libera recuperação
    // ============================================================
    let recoveryReleased = false
    const isRecovery = exam?.isRecovery === true

    if (!isRecovery && roundedScore < NOTA_CORTE) {
      // Verificar se já existe uma prova de recuperação para esta prova
      let recoveryExam = await db.exam.findFirst({
        where: { recoveryForExamId: id },
      })

      if (!recoveryExam) {
        // Criar a prova de recuperação (cópia da original)
        recoveryExam = await db.exam.create({
          data: {
            title: `${exam?.title || 'Prova'} - Recuperação`,
            description: 'Prova de recuperação liberada automaticamente',
            turmaId: null, // recuperação é individual
            subjectId: exam?.subjectId || null,
            startDateTime: now,
            endDateTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 dias
            durationMinutes: exam?.durationMinutes || 60,
            active: true,
            isRecovery: true,
            recoveryForExamId: id,
            questions: {
              create: examQuestions.map((eq, index) => ({
                questionId: eq.questionId,
                order: index,
              })),
            },
          },
        })
      }

      // Verificar se já existe agendamento de recuperação para este aluno
      const existingAssignment = await db.examAssignment.findUnique({
        where: { examId_userId: { examId: recoveryExam.id, userId: user.id } },
      })

      if (!existingAssignment) {
        // Liberar a recuperação imediatamente para o aluno
        await db.examAssignment.create({
          data: {
            examId: recoveryExam.id,
            userId: user.id,
            startDateTime: now, // disponível imediatamente
            endDateTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 dias para realizar
            durationMinutes: exam?.durationMinutes || 60,
          },
        })
        recoveryReleased = true
      }
    }

    return NextResponse.json({
      success: true,
      resultId: updated.id,
      score: updated.score,
      correctCount: updated.correctCount,
      totalQuestions: updated.totalQuestions,
      timeSpentSeconds: updated.timeSpentSeconds,
      status: updated.status,
      autoSubmitted,
      notaCorte: NOTA_CORTE,
      aprovado: roundedScore >= NOTA_CORTE,
      recoveryReleased, // true se a recuperação foi liberada agora
      isRecovery,
    })
  } catch (error) {
    console.error('Submit exam error:', error)
    return NextResponse.json({ error: 'Erro ao submeter prova.' }, { status: 500 })
  }
}
