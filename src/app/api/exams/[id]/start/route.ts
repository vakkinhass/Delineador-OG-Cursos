import { NextRequest, NextResponse } from 'next/server'
import { query, generateId } from '@/lib/db-pg'
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

  const examRes = await query(
    `SELECT id, "turmaId", "startDateTime", "endDateTime", "durationMinutes"
       FROM "Exam" WHERE id = $1`,
    [id]
  )
  if (examRes.rows.length === 0) {
    return NextResponse.json({ error: 'Prova não encontrada.' }, { status: 404 })
  }
  const exam = examRes.rows[0]

  // Buscar atribuição individual (se houver)
  const assignmentRes = await query(
    `SELECT "startDateTime" AS startdatetime, "endDateTime" AS enddatetime,
            "durationMinutes" AS durationminutes
       FROM "ExamAssignment"
      WHERE "examId" = $1 AND "userId" = $2`,
    [id, user.id]
  )
  const assignment = assignmentRes.rows[0] || null

  // Verificar acesso do aluno (turma OU atribuição)
  const userTurmasRes = await query(
    'SELECT "turmaId" AS turmaid FROM "UserTurma" WHERE "userId" = $1',
    [user.id]
  )
  const turmaIds = userTurmasRes.rows.map((t) => t.turmaid)
  const isInTurma = exam.turmaid && turmaIds.includes(exam.turmaid)

  if (!assignment && !isInTurma) {
    return NextResponse.json({ error: 'Você não tem acesso a esta prova.' }, { status: 403 })
  }

  // Janela de tempo efetiva
  const effectiveStart = assignment ? new Date(assignment.startdatetime) : new Date(exam.startdatetime)
  const effectiveEnd = assignment ? new Date(assignment.enddatetime) : new Date(exam.enddatetime)
  const effectiveDuration = assignment?.durationminutes || exam.durationminutes

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

  // Buscar questões da prova
  const questionsRes = await query(
    `SELECT q.id, q.statement, q."optionA" AS optiona, q."optionB" AS optionb, q."optionC" AS optionc, q."optionD" AS optiond,
            s.name AS subjectname
       FROM "ExamQuestion" eq
       JOIN "Question" q ON q.id = eq."questionId"
       LEFT JOIN "Subject" s ON s.id = q."subjectId"
      WHERE eq."examId" = $1
      ORDER BY eq."order" ASC`,
    [id]
  )

  // Verificar se já existe resultado
  const existingRes = await query(
    `SELECT id, answers, status, "startedAt" AS startedat, "totalQuestions" AS totalquestions
       FROM "ExamResult"
      WHERE "examId" = $1 AND "userId" = $2`,
    [id, user.id]
  )
  const existing = existingRes.rows[0] || null

  if (existing && (existing.status === 'SUBMITTED' || existing.status === 'AUTO_SUBMITTED')) {
    return NextResponse.json({
      error: 'Você já finalizou esta prova.',
      status: 'ALREADY_SUBMITTED',
      resultId: existing.id,
    }, { status: 403 })
  }

  // Criar ou atualizar resultado
  let resultId: string
  let startedAt: Date
  if (existing) {
    startedAt = existing.startedat ? new Date(existing.startedat) : now
    await query(
      `UPDATE "ExamResult"
          SET status = 'IN_PROGRESS', "startedAt" = $3, "updatedAt" = NOW()
        WHERE id = $1 AND "userId" = $2`,
      [existing.id, user.id, startedAt]
    )
    resultId = existing.id
  } else {
    resultId = generateId()
    startedAt = now
    await query(
      `INSERT INTO "ExamResult" (id, "examId", "userId", answers, score,
           "correctCount", "totalQuestions", "timeSpentSeconds",
           "startedAt", "submittedAt", status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, '{}', 0, 0, $4, 0, $5, NULL, 'IN_PROGRESS', NOW(), NOW())`,
      [resultId, id, user.id, questionsRes.rows.length, startedAt]
    )
  }

  // Calcular tempo limite (o que terminar primeiro: duração ou fim da janela)
  const deadlineByDuration = new Date(startedAt.getTime() + effectiveDuration * 60 * 1000)
  const deadline = deadlineByDuration < effectiveEnd ? deadlineByDuration : effectiveEnd

  // Parsear respostas salvas (se houver)
  let savedAnswers = {}
  if (existing?.answers) {
    try {
      savedAnswers = JSON.parse(existing.answers)
    } catch {
      savedAnswers = {}
    }
  }

  return NextResponse.json({
    resultId,
    startedAt: startedAt.toISOString(),
    deadline: deadline.toISOString(),
    durationMinutes: effectiveDuration,
    totalQuestions: questionsRes.rows.length,
    questions: questionsRes.rows.map((q, index) => ({
      id: q.id,
      index: index + 1,
      subjectName: q.subjectname,
      statement: q.statement,
      optionA: q.optiona,
      optionB: q.optionb,
      optionC: q.optionc,
      optionD: q.optiond,
    })),
    savedAnswers,
  })
}
