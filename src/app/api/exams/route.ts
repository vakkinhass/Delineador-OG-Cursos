import { NextRequest, NextResponse } from 'next/server'
import { query, generateId } from '@/lib/db-pg'
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
    const examsRes = await query(
      `SELECT e.id, e.title, e.description,
              e."turmaId" AS turmaid, e."subjectId" AS subjectid,
              e."startDateTime" AS startdatetime, e."endDateTime" AS enddatetime,
              e."durationMinutes" AS durationminutes,
              e.active, e."isRecovery" AS isrecovery,
              t.name AS turmaname, s.name AS subjectname
         FROM "Exam" e
         LEFT JOIN "Turma" t ON t.id = e."turmaId"
         LEFT JOIN "Subject" s ON s.id = e."subjectId"
         ${turmaId ? 'WHERE e."turmaId" = $1' : ''}
        ORDER BY e."startDateTime" DESC`,
      turmaId ? [turmaId] : []
    )

    const examIds = examsRes.rows.map((e) => e.id)
    let questionCounts: Record<string, number> = {}
    let assignmentCounts: Record<string, number> = {}
    if (examIds.length > 0) {
      const qCountRes = await query(
        `SELECT "examId" AS examid, COUNT(*)::int AS count
           FROM "ExamQuestion"
          WHERE "examId" = ANY($1::text[])
          GROUP BY "examId"`,
        [examIds]
      )
      for (const row of qCountRes.rows) questionCounts[row.examid] = row.count

      const aCountRes = await query(
        `SELECT "examId" AS examid, COUNT(*)::int AS count
           FROM "ExamAssignment"
          WHERE "examId" = ANY($1::text[])
          GROUP BY "examId"`,
        [examIds]
      )
      for (const row of aCountRes.rows) assignmentCounts[row.examid] = row.count
    }

    return NextResponse.json({
      exams: examsRes.rows.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        turmaId: e.turmaid,
        turmaName: e.turmaname || null,
        subjectId: e.subjectid,
        subjectName: e.subjectname || null,
        startDateTime: new Date(e.startdatetime).toISOString(),
        endDateTime: new Date(e.enddatetime).toISOString(),
        durationMinutes: e.durationminutes,
        active: e.active,
        isRecovery: e.isrecovery,
        questionCount: questionCounts[e.id] || 0,
        assignmentCount: assignmentCounts[e.id] || 0,
      })),
    })
  }

  // ALUNO: vê provas da sua turma + atribuições individuais
  const userTurmasRes = await query(
    'SELECT "turmaId" AS turmaid FROM "UserTurma" WHERE "userId" = $1',
    [user.id]
  )
  const turmaIds = userTurmasRes.rows.map((t) => t.turmaid)

  // Provas da turma do aluno
  let turmaExamsRows: any[] = []
  if (turmaIds.length > 0) {
    const turmaExamsRes = await query(
      `SELECT e.id, e.title, e.description,
              e."turmaId" AS turmaid, e."subjectId" AS subjectid,
              e."startDateTime" AS startdatetime, e."endDateTime" AS enddatetime,
              e."durationMinutes" AS durationminutes,
              e.active, e."isRecovery" AS isrecovery,
              t.name AS turmaname, s.name AS subjectname
         FROM "Exam" e
         LEFT JOIN "Turma" t ON t.id = e."turmaId"
         LEFT JOIN "Subject" s ON s.id = e."subjectId"
        WHERE e."turmaId" = ANY($1::text[]) AND e.active = true
        ORDER BY e."startDateTime" DESC`,
      [turmaIds]
    )
    turmaExamsRows = turmaExamsRes.rows
  }

  // Provas atribuídas individualmente
  const assignmentsRes = await query(
    `SELECT a."examId" AS examid, a."startDateTime" AS startdatetime,
            a."endDateTime" AS enddatetime, a."durationMinutes" AS durationminutes,
            e.title, e.description, e."subjectId" AS subjectid,
            e.active, e."isRecovery" AS isrecovery,
            s.name AS subjectname
       FROM "ExamAssignment" a
       JOIN "Exam" e ON e.id = a."examId"
       LEFT JOIN "Subject" s ON s.id = e."subjectId"
      WHERE a."userId" = $1`,
    [user.id]
  )

  const allExamIds = [
    ...turmaExamsRows.map((e) => e.id),
    ...assignmentsRes.rows.map((a) => a.examid),
  ]

  let questionCounts: Record<string, number> = {}
  let resultsByExam: Record<string, any> = {}
  if (allExamIds.length > 0) {
    const qCountRes = await query(
      `SELECT "examId" AS examid, COUNT(*)::int AS count
         FROM "ExamQuestion"
        WHERE "examId" = ANY($1::text[])
        GROUP BY "examId"`,
      [allExamIds]
    )
    for (const row of qCountRes.rows) questionCounts[row.examid] = row.count

    const resultsRes = await query(
      `SELECT id, "examId" AS examid, status, score
         FROM "ExamResult"
        WHERE "userId" = $1 AND "examId" = ANY($2::text[])`,
      [user.id, allExamIds]
    )
    for (const row of resultsRes.rows) resultsByExam[row.examid] = row
  }

  const assignedExams = assignmentsRes.rows.map((a) => ({
    id: a.examid,
    title: a.title,
    description: a.description,
    turmaId: null,
    turmaName: 'Prova Individual',
    subjectId: a.subjectid,
    subjectName: a.subjectname || null,
    startDateTime: new Date(a.startdatetime).toISOString(),
    endDateTime: new Date(a.enddatetime).toISOString(),
    durationMinutes: a.durationminutes || null,
    active: a.active,
    isRecovery: a.isrecovery,
    questionCount: questionCounts[a.examid] || 0,
    isAssigned: true,
    result: resultsByExam[a.examid] || null,
  }))

  const turmaExamsFormatted = turmaExamsRows.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    turmaId: e.turmaid,
    turmaName: e.turmaname || null,
    subjectId: e.subjectid,
    subjectName: e.subjectname || null,
    startDateTime: new Date(e.startdatetime).toISOString(),
    endDateTime: new Date(e.enddatetime).toISOString(),
    durationMinutes: e.durationminutes,
    active: e.active,
    isRecovery: e.isrecovery,
    questionCount: questionCounts[e.id] || 0,
    isAssigned: false,
    result: resultsByExam[e.id] || null,
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
      const params: any[] = []
      const conditions: string[] = []
      if (subjectIds.length > 0) {
        params.push(subjectIds)
        conditions.push(`"subjectId" = ANY($${params.length}::text[])`)
      }
      if (difficulty !== 'ANY') {
        params.push(difficulty)
        conditions.push(`difficulty = $${params.length}`)
      }
      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      const candidatesRes = await query(`SELECT id FROM "Question" ${where}`, params)
      const candidates = candidatesRes.rows.map((r) => r.id)

      // Embaralhar e pegar N
      const shuffled = [...candidates].sort(() => Math.random() - 0.5)
      selectedQuestionIds = shuffled.slice(0, Math.min(questionCount, shuffled.length))
    }

    if (selectedQuestionIds.length === 0) {
      return NextResponse.json({ error: 'Nenhuma questão selecionada para a prova.' }, { status: 400 })
    }

    const examId = generateId()
    await query(
      `INSERT INTO "Exam" (id, title, description, "turmaId", "subjectId",
           "startDateTime", "endDateTime", "durationMinutes", active,
           "isRecovery", "recoveryForExamId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false, NULL, NOW(), NOW())`,
      [examId, title, description, turmaId, subjectId, startDateTime, endDateTime, durationMinutes]
    )

    for (let i = 0; i < selectedQuestionIds.length; i++) {
      await query(
        `INSERT INTO "ExamQuestion" (id, "examId", "questionId", "order")
         VALUES ($1, $2, $3, $4)`,
        [generateId(), examId, selectedQuestionIds[i], i]
      )
    }

    return NextResponse.json({
      success: true,
      exam: { id: examId, title, questionCount: selectedQuestionIds.length },
    })
  } catch (error) {
    console.error('Create exam error:', error)
    return NextResponse.json({ error: 'Erro ao criar prova.' }, { status: 500 })
  }
}
