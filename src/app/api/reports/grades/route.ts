import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { requireAdmin } from '@/lib/auth'

// GET /api/reports/grades?turmaId=xxx
// Relatório consolidado de notas por turma com estatísticas.
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const turmaId = searchParams.get('turmaId')

  // Buscar provas
  const examsRes = await query(
    `SELECT e.id, e.title, e."startDateTime" AS startdatetime,
            t.name AS "turmaName", s.name AS "subjectName"
       FROM "Exam" e
       LEFT JOIN "Turma" t ON t.id = e."turmaId"
       LEFT JOIN "Subject" s ON s.id = e."subjectId"
       ${turmaId ? 'WHERE e."turmaId" = $1' : ''}
      ORDER BY e."startDateTime" DESC`,
    turmaId ? [turmaId] : []
  )

  const examIds = examsRes.rows.map((e) => e.id)

  // Contar questões por prova
  let questionCounts: Record<string, number> = {}
  if (examIds.length > 0) {
    const qCountRes = await query(
      `SELECT "examId" AS examid, COUNT(*)::int AS count
         FROM "ExamQuestion"
        WHERE "examId" = ANY($1::text[])
        GROUP BY "examId"`,
      [examIds]
    )
    for (const row of qCountRes.rows) questionCounts[row.examid] = row.count
  }

  // Buscar resultados submetidos (com dados do usuário e suas turmas)
  let resultsByExam: Record<string, any[]> = {}
  if (examIds.length > 0) {
    const resultsRes = await query(
      `SELECT r.id, r."examId" AS examid, r."userId" AS userid, r.score,
              r."correctCount" AS correctcount, r."totalQuestions" AS totalquestions,
              r."timeSpentSeconds" AS timespentseconds, r.status,
              r."submittedAt" AS submittedat,
              u.name AS "userName", u.cpf AS "userCpf"
         FROM "ExamResult" r
         JOIN "User" u ON u.id = r."userId"
        WHERE r."examId" = ANY($1::text[])
          AND r.status IN ('SUBMITTED', 'AUTO_SUBMITTED')`,
      [examIds]
    )
    for (const row of resultsRes.rows) {
      if (!resultsByExam[row.examid]) resultsByExam[row.examid] = []
      resultsByExam[row.examid].push(row)
    }
  }

  // Buscar alunos da turma (para listar mesmo os que não fizeram prova)
  let students: { id: string; name: string; cpf: string }[] = []
  if (turmaId) {
    const userTurmasRes = await query(
      `SELECT u.id, u.name, u.cpf
         FROM "UserTurma" ut
         JOIN "User" u ON u.id = ut."userId"
        WHERE ut."turmaId" = $1
        ORDER BY u.name ASC`,
      [turmaId]
    )
    students = userTurmasRes.rows.map((u) => ({
      id: u.id, name: u.name, cpf: u.cpf,
    }))
  }

  // Construir relatório por prova
  const examReports = examsRes.rows.map((exam) => {
    const examResults = resultsByExam[exam.id] || []
    const scores = examResults.map((r) => r.score)
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const max = scores.length > 0 ? Math.max(...scores) : 0
    const min = scores.length > 0 ? Math.min(...scores) : 0

    return {
      examId: exam.id,
      title: exam.title,
      turmaName: exam.turmaname || 'Sem turma',
      subjectName: exam.subjectname || 'Multi',
      startDateTime: new Date(exam.startdatetime).toISOString(),
      questionCount: questionCounts[exam.id] || 0,
      totalStudents: students.length || examResults.length,
      submittedCount: examResults.length,
      statistics: {
        average: Math.round(avg * 100) / 100,
        highest: Math.round(max * 100) / 100,
        lowest: Math.round(min * 100) / 100,
      },
      results: examResults.map((r) => ({
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
    }
  })

  // Estatísticas gerais da turma (todas as provas)
  const allScores = examReports.flatMap((e) => e.results.map((r) => r.score))
  const generalStats = {
    totalExams: examsRes.rows.length,
    totalSubmissions: allScores.length,
    average: allScores.length > 0 ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100 : 0,
    highest: allScores.length > 0 ? Math.max(...allScores) : 0,
    lowest: allScores.length > 0 ? Math.min(...allScores) : 0,
  }

  return NextResponse.json({
    turmaId,
    examReports,
    students,
    generalStats,
  })
}
