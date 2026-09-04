import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, requireAdmin } from '@/lib/auth'

// GET /api/exams/[id] - Detalhes da prova
// Admin: vê tudo (com gabarito). Aluno: vê questões SEM gabarito (apenas na janela de tempo).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const now = new Date()

  const exam = await db.exam.findUnique({
    where: { id },
    include: {
      turma: { select: { name: true } },
      subject: { select: { name: true } },
      questions: {
        orderBy: { order: 'asc' },
        include: { question: { include: { subject: { select: { name: true } } } } },
      },
      assignments: {
        include: { user: { select: { id: true, name: true, cpf: true } } },
      },
      results: {
        where: user.role === 'STUDENT' ? { userId: user.id } : undefined,
        include: { user: { select: { id: true, name: true, cpf: true } } },
      },
    },
  })

  if (!exam) {
    return NextResponse.json({ error: 'Prova não encontrada.' }, { status: 404 })
  }

  // Verificar acesso do aluno
  if (user.role === 'STUDENT') {
    // Verificar se o aluno tem acesso: turma OU atribuição individual
    const userTurmas = await db.userTurma.findMany({
      where: { userId: user.id },
      select: { turmaId: true },
    })
    const turmaIds = userTurmas.map((t) => t.turmaId)

    const assignment = exam.assignments.find((a) => a.userId === user.id)
    const isInTurma = exam.turmaId && turmaIds.includes(exam.turmaId)

    if (!assignment && !isInTurma) {
      return NextResponse.json({ error: 'Você não tem acesso a esta prova.' }, { status: 403 })
    }

    // Determinar janela de tempo efetiva
    const effectiveStart = assignment ? assignment.startDateTime : exam.startDateTime
    const effectiveEnd = assignment ? assignment.endDateTime : exam.endDateTime

    // Verificar janela de tempo
    if (now < effectiveStart) {
      return NextResponse.json({
        error: 'Prova ainda não está disponível.',
        status: 'BEFORE_WINDOW',
        startDateTime: effectiveStart.toISOString(),
        endDateTime: effectiveEnd.toISOString(),
        now: now.toISOString(),
      }, { status: 403 })
    }

    if (now > effectiveEnd) {
      return NextResponse.json({
        error: 'O período de realização desta prova encerrou.',
        status: 'AFTER_WINDOW',
      }, { status: 403 })
    }

    // Retornar questões SEM gabarito
    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        subjectName: exam.subject?.name || null,
        startDateTime: effectiveStart.toISOString(),
        endDateTime: effectiveEnd.toISOString(),
        durationMinutes: assignment?.durationMinutes || exam.durationMinutes,
        totalQuestions: exam.questions.length,
      },
      questions: exam.questions.map((eq, index) => ({
        id: eq.question.id,
        index: index + 1,
        subjectName: eq.question.subject.name,
        statement: eq.question.statement,
        optionA: eq.question.optionA,
        optionB: eq.question.optionB,
        optionC: eq.question.optionC,
        optionD: eq.question.optionD,
        // SEM correctAnswer
      })),
      existingResult: exam.results[0] || null,
    })
  }

  // ADMIN: retorna tudo com gabarito
  return NextResponse.json({
    exam: {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      turmaId: exam.turmaId,
      turmaName: exam.turma?.name || null,
      subjectId: exam.subjectId,
      subjectName: exam.subject?.name || null,
      startDateTime: exam.startDateTime.toISOString(),
      endDateTime: exam.endDateTime.toISOString(),
      durationMinutes: exam.durationMinutes,
      active: exam.active,
      totalQuestions: exam.questions.length,
    },
    questions: exam.questions.map((eq, index) => ({
      id: eq.question.id,
      index: index + 1,
      subjectName: eq.question.subject.name,
      difficulty: eq.question.difficulty,
      statement: eq.question.statement,
      optionA: eq.question.optionA,
      optionB: eq.question.optionB,
      optionC: eq.question.optionC,
      optionD: eq.question.optionD,
      correctAnswer: eq.question.correctAnswer,
      explanation: eq.question.explanation,
    })),
    assignments: exam.assignments.map((a) => ({
      id: a.id,
      userId: a.userId,
      userName: a.user.name,
      userCpf: a.user.cpf,
      startDateTime: a.startDateTime.toISOString(),
      endDateTime: a.endDateTime.toISOString(),
      durationMinutes: a.durationMinutes,
    })),
    results: exam.results.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user.name,
      userCpf: r.user.cpf,
      score: r.score,
      correctCount: r.correctCount,
      totalQuestions: r.totalQuestions,
      timeSpentSeconds: r.timeSpentSeconds,
      status: r.status,
      submittedAt: r.submittedAt?.toISOString() || null,
    })),
  })
}

// DELETE /api/exams/[id] - Remove prova (Admin)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  }

  const { id } = await params

  try {
    await db.exam.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete exam error:', error)
    return NextResponse.json({ error: 'Erro ao remover prova.' }, { status: 500 })
  }
}
