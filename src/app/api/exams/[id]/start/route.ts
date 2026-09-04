import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST /api/exams/[id]/start
// Inicia a prova: cria/retorna um ExamResult com status IN_PROGRESS.
// Aplica a janela de tempo rigorosamente.
export async function POST(
  _request: NextRequest,
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
      assignments: { where: { userId: user.id } },
      questions: { orderBy: { order: 'asc' }, include: { question: { include: { subject: { select: { name: true } } } } } },
    },
  })

  if (!exam) {
    return NextResponse.json({ error: 'Prova não encontrada.' }, { status: 404 })
  }

  // Verificar acesso do aluno
  const userTurmas = await db.userTurma.findMany({
    where: { userId: user.id },
    select: { turmaId: true },
  })
  const turmaIds = userTurmas.map((t) => t.turmaId)
  const assignment = exam.assignments[0]
  const isInTurma = exam.turmaId && turmaIds.includes(exam.turmaId)

  if (!assignment && !isInTurma) {
    return NextResponse.json({ error: 'Você não tem acesso a esta prova.' }, { status: 403 })
  }

  // Janela de tempo efetiva
  const effectiveStart = assignment ? assignment.startDateTime : exam.startDateTime
  const effectiveEnd = assignment ? assignment.endDateTime : exam.endDateTime
  const effectiveDuration = assignment?.durationMinutes || exam.durationMinutes

  if (now < effectiveStart) {
    return NextResponse.json({
      error: 'Prova ainda não está liberada.',
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

  // Verificar se já existe resultado submetido
  const existing = await db.examResult.findUnique({
    where: { examId_userId: { examId: id, userId: user.id } },
  })

  if (existing && (existing.status === 'SUBMITTED' || existing.status === 'AUTO_SUBMITTED')) {
    return NextResponse.json({
      error: 'Você já finalizou esta prova.',
      status: 'ALREADY_SUBMITTED',
      resultId: existing.id,
    }, { status: 403 })
  }

  // Criar ou atualizar resultado
  const result = await db.examResult.upsert({
    where: { examId_userId: { examId: id, userId: user.id } },
    update: {
      status: 'IN_PROGRESS',
      startedAt: existing?.startedAt || now,
    },
    create: {
      examId: id,
      userId: user.id,
      status: 'IN_PROGRESS',
      startedAt: now,
      totalQuestions: exam.questions.length,
    },
  })

  // Calcular tempo limite (o que terminar primeiro: duração ou fim da janela)
  const deadlineByDuration = new Date(result.startedAt!.getTime() + effectiveDuration * 60 * 1000)
  const deadline = deadlineByDuration < effectiveEnd ? deadlineByDuration : effectiveEnd

  return NextResponse.json({
    resultId: result.id,
    startedAt: result.startedAt!.toISOString(),
    deadline: deadline.toISOString(),
    durationMinutes: effectiveDuration,
    totalQuestions: exam.questions.length,
    questions: exam.questions.map((eq, index) => ({
      id: eq.question.id,
      index: index + 1,
      subjectName: eq.question.subject.name,
      statement: eq.question.statement,
      optionA: eq.question.optionA,
      optionB: eq.question.optionB,
      optionC: eq.question.optionC,
      optionD: eq.question.optionD,
    })),
    savedAnswers: existing?.answers ? JSON.parse(existing.answers) : {},
  })
}
