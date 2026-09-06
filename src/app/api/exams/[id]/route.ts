import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
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

  const examRes = await query(
    `SELECT e.id, e.title, e.description, e."turmaId", e."subjectId",
            e."startDateTime", e."endDateTime", e."durationMinutes",
            e.active, e."isRecovery",
            t.name AS "turmaName", s.name AS "subjectName"
       FROM "Exam" e
       LEFT JOIN "Turma" t ON t.id = e."turmaId"
       LEFT JOIN "Subject" s ON s.id = e."subjectId"
      WHERE e.id = $1`,
    [id]
  )

  if (examRes.rows.length === 0) {
    return NextResponse.json({ error: 'Prova não encontrada.' }, { status: 404 })
  }
  const exam = examRes.rows[0]

  // Buscar questões da prova (com disciplina)
  const questionsRes = await query(
    `SELECT eq."questionId" AS questionid, eq."order" AS order_num,
            q.id, q."subjectId" AS subjectid, q.difficulty, q.statement,
            q."optionA", q."optionB", q."optionC", q."optionD",
            q."correctAnswer" AS correctanswer, q.explanation,
            s.name AS "subjectName"
       FROM "ExamQuestion" eq
       JOIN "Question" q ON q.id = eq."questionId"
       LEFT JOIN "Subject" s ON s.id = q."subjectId"
      WHERE eq."examId" = $1
      ORDER BY eq."order" ASC`,
    [id]
  )

  // Buscar atribuições
  const assignmentsRes = await query(
    `SELECT a.id, a."userId" AS userid, a."startDateTime" AS startdatetime,
            a."endDateTime" AS enddatetime, a."durationMinutes" AS durationminutes,
            u.name AS "userName", u.cpf AS "userCpf"
       FROM "ExamAssignment" a
       JOIN "User" u ON u.id = a."userId"
      WHERE a."examId" = $1`,
    [id]
  )

  // Buscar resultados (admin vê todos, aluno vê só o seu)
  const resultsRes = user.role === 'STUDENT'
    ? await query(
        `SELECT r.id, r."examId" AS examid, r."userId" AS userid, r.score,
                r."correctCount" AS correctcount, r."totalQuestions" AS totalquestions,
                r."timeSpentSeconds" AS timespentseconds, r.status,
                r."submittedAt" AS submittedat,
                u.name AS "userName", u.cpf AS "userCpf"
           FROM "ExamResult" r
           JOIN "User" u ON u.id = r."userId"
          WHERE r."examId" = $1 AND r."userId" = $2`,
        [id, user.id]
      )
    : await query(
        `SELECT r.id, r."examId" AS examid, r."userId" AS userid, r.score,
                r."correctCount" AS correctcount, r."totalQuestions" AS totalquestions,
                r."timeSpentSeconds" AS timespentseconds, r.status,
                r."submittedAt" AS submittedat,
                u.name AS "userName", u.cpf AS "userCpf"
           FROM "ExamResult" r
           JOIN "User" u ON u.id = r."userId"
          WHERE r."examId" = $1`,
        [id]
      )

  // Verificar acesso do aluno
  if (user.role === 'STUDENT') {
    const userTurmasRes = await query(
      'SELECT "turmaId" AS turmaid FROM "UserTurma" WHERE "userId" = $1',
      [user.id]
    )
    const turmaIds = userTurmasRes.rows.map((t) => t.turmaid)

    const assignment = assignmentsRes.rows.find((a) => a.userid === user.id)
    const isInTurma = exam.turmaid && turmaIds.includes(exam.turmaid)

    if (!assignment && !isInTurma) {
      return NextResponse.json({ error: 'Você não tem acesso a esta prova.' }, { status: 403 })
    }

    // Determinar janela de tempo efetiva
    const effectiveStart = assignment ? new Date(assignment.startdatetime) : new Date(exam.startdatetime)
    const effectiveEnd = assignment ? new Date(assignment.enddatetime) : new Date(exam.enddatetime)

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
        subjectName: exam.subjectname || null,
        startDateTime: effectiveStart.toISOString(),
        endDateTime: effectiveEnd.toISOString(),
        durationMinutes: assignment?.durationminutes || exam.durationminutes,
        totalQuestions: questionsRes.rows.length,
      },
      questions: questionsRes.rows.map((q, index) => ({
        id: q.id,
        index: index + 1,
        subjectName: q.subjectname,
        statement: q.statement,
        optionA: q.optiona,
        optionB: q.optionb,
        optionC: q.optionc,
        optionD: q.optiond,
        // SEM correctAnswer
      })),
      existingResult: resultsRes.rows[0] || null,
    })
  }

  // ADMIN: retorna tudo com gabarito
  return NextResponse.json({
    exam: {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      turmaId: exam.turmaid,
      turmaName: exam.turmaname || null,
      subjectId: exam.subjectid,
      subjectName: exam.subjectname || null,
      startDateTime: new Date(exam.startdatetime).toISOString(),
      endDateTime: new Date(exam.enddatetime).toISOString(),
      durationMinutes: exam.durationminutes,
      active: exam.active,
      totalQuestions: questionsRes.rows.length,
    },
    questions: questionsRes.rows.map((q, index) => ({
      id: q.id,
      index: index + 1,
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
    assignments: assignmentsRes.rows.map((a) => ({
      id: a.id,
      userId: a.userid,
      userName: a.username,
      userCpf: a.usercpf,
      startDateTime: new Date(a.startdatetime).toISOString(),
      endDateTime: new Date(a.enddatetime).toISOString(),
      durationMinutes: a.durationminutes,
    })),
    results: resultsRes.rows.map((r) => ({
      id: r.id,
      userId: r.userid,
      userName: r.username,
      userCpf: r.usercpf,
      score: r.score,
      correctCount: r.correctcount,
      totalQuestions: r.totalquestions,
      timeSpentSeconds: r.timespentseconds,
      status: r.status,
      submittedAt: r.submittedat ? new Date(r.submittedat).toISOString() : null,
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
    await query('DELETE FROM "Exam" WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete exam error:', error)
    return NextResponse.json({ error: 'Erro ao remover prova.' }, { status: 500 })
  }
}
