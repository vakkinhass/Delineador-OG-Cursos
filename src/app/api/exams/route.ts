import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, requireAdmin } from '@/lib/auth'

// GET /api/exams - Lista provas
// Admin: vê todas. Aluno: vê provas da sua turma + provas atribuídas a ele.
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const turmaId = searchParams.get('turmaId')

  if (user.role === 'ADMIN') {
    // Admin vê todas (ou filtra por turma)
    const where = turmaId ? { turmaId } : {}
    const exams = await db.exam.findMany({
      where,
      orderBy: { startDateTime: 'desc' },
      include: {
        turma: { select: { name: true } },
        subject: { select: { name: true } },
        _count: { select: { questions: true, assignments: true } },
      },
    })

    return NextResponse.json({
      exams: exams.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        turmaId: e.turmaId,
        turmaName: e.turma?.name || null,
        subjectId: e.subjectId,
        subjectName: e.subject?.name || null,
        startDateTime: e.startDateTime.toISOString(),
        endDateTime: e.endDateTime.toISOString(),
        durationMinutes: e.durationMinutes,
        active: e.active,
        questionCount: e._count.questions,
        assignmentCount: e._count.assignments,
      })),
    })
  }

  // ALUNO: vê provas da sua turma + atribuições individuais
  const userTurmas = await db.userTurma.findMany({
    where: { userId: user.id },
    select: { turmaId: true },
  })
  const turmaIds = userTurmas.map((t) => t.turmaId)

  // Provas da turma do aluno
  const turmaExams = await db.exam.findMany({
    where: { turmaId: { in: turmaIds }, active: true },
    orderBy: { startDateTime: 'desc' },
    include: {
      turma: { select: { name: true } },
      subject: { select: { name: true } },
      _count: { select: { questions: true } },
      results: { where: { userId: user.id }, select: { id: true, status: true, score: true } },
    },
  })

  // Provas atribuídas individualmente
  const assignments = await db.examAssignment.findMany({
    where: { userId: user.id },
    include: {
      exam: {
        include: {
          subject: { select: { name: true } },
          _count: { select: { questions: true } },
          results: { where: { userId: user.id }, select: { id: true, status: true, score: true } },
        },
      },
    },
  })

  const assignedExams = assignments.map((a) => ({
    id: a.exam.id,
    title: a.exam.title,
    description: a.exam.description,
    turmaId: null,
    turmaName: 'Prova Individual',
    subjectId: a.exam.subjectId,
    subjectName: a.exam.subject?.name || null,
    startDateTime: a.startDateTime.toISOString(),
    endDateTime: a.endDateTime.toISOString(),
    durationMinutes: a.durationMinutes || a.exam.durationMinutes,
    active: a.exam.active,
    questionCount: a.exam._count.questions,
    isAssigned: true,
    result: a.exam.results[0] || null,
  }))

  const turmaExamsFormatted = turmaExams.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    turmaId: e.turmaId,
    turmaName: e.turma?.name || null,
    subjectId: e.subjectId,
    subjectName: e.subject?.name || null,
    startDateTime: e.startDateTime.toISOString(),
    endDateTime: e.endDateTime.toISOString(),
    durationMinutes: e.durationMinutes,
    active: e.active,
    questionCount: e._count.questions,
    isAssigned: false,
    result: e.results[0] || null,
  }))

  return NextResponse.json({
    exams: [...turmaExamsFormatted, ...assignedExams],
  })
}

// POST /api/exams - Cria nova prova (Admin)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const title = String(body.title || '').trim()
    const description = body.description ? String(body.description) : null
    const turmaId = body.turmaId || null
    const subjectId = body.subjectId || null
    const startDateTime = new Date(body.startDateTime)
    const endDateTime = new Date(body.endDateTime)
    const durationMinutes = parseInt(body.durationMinutes, 10)
    const questionIds: string[] = body.questionIds || []
    const subjectIds: string[] = body.subjectIds || [] // para seleção por disciplina
    const difficulty = body.difficulty || 'EASY'
    const questionCount = parseInt(body.questionCount, 10) || 10

    if (!title || isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return NextResponse.json({ error: 'Título, data de início e fim são obrigatórios.' }, { status: 400 })
    }

    if (endDateTime <= startDateTime) {
      return NextResponse.json({ error: 'Data/hora de término deve ser posterior à de início.' }, { status: 400 })
    }

    if (!durationMinutes || durationMinutes < 1) {
      return NextResponse.json({ error: 'Duração inválida.' }, { status: 400 })
    }

    // Selecionar questões: IDs específicos OU por disciplina/dificuldade
    let selectedQuestionIds = questionIds
    if (selectedQuestionIds.length === 0) {
      const where: { subjectId?: { in: string[] }; difficulty?: string } = {}
      if (subjectIds.length > 0) where.subjectId = { in: subjectIds }
      if (difficulty !== 'ANY') where.difficulty = difficulty

      const candidates = await db.question.findMany({
        where,
        select: { id: true },
      })

      // Embaralhar e pegar N
      const shuffled = [...candidates].sort(() => Math.random() - 0.5)
      selectedQuestionIds = shuffled.slice(0, Math.min(questionCount, shuffled.length)).map((q) => q.id)
    }

    if (selectedQuestionIds.length === 0) {
      return NextResponse.json({ error: 'Nenhuma questão selecionada para a prova.' }, { status: 400 })
    }

    const exam = await db.exam.create({
      data: {
        title,
        description,
        turmaId,
        subjectId,
        startDateTime,
        endDateTime,
        durationMinutes,
        active: true,
        questions: {
          create: selectedQuestionIds.map((questionId, index) => ({
            questionId,
            order: index,
          })),
        },
      },
      include: { _count: { select: { questions: true } } },
    })

    return NextResponse.json({
      success: true,
      exam: { id: exam.id, title: exam.title, questionCount: exam._count.questions },
    })
  } catch (error) {
    console.error('Create exam error:', error)
    return NextResponse.json({ error: 'Erro ao criar prova.' }, { status: 500 })
  }
}
