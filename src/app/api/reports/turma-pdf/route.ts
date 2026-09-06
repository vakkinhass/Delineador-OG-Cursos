import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { requireAdmin } from '@/lib/auth'
import { generateTurmaReportPdf } from '@/lib/pdf-generator'

const NOTA_CORTE = 60

// GET /api/reports/turma-pdf?turmaId=xxx
// Exporta o relatório consolidado da turma em PDF com as cores da Ocean Green.
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const turmaId = searchParams.get('turmaId')

  // Buscar provas oficiais (não de recuperação)
  const params: any[] = []
  const conditions = [`e."isRecovery" = false`]
  if (turmaId) {
    params.push(turmaId)
    conditions.push(`e."turmaId" = $${params.length}`)
  }

  const examsRes = await query(
    `SELECT e.id, e.title,
            t.name AS "turmaName", s.name AS "subjectName"
       FROM "Exam" e
       LEFT JOIN "Turma" t ON t.id = e."turmaId"
       LEFT JOIN "Subject" s ON s.id = e."subjectId"
      WHERE ${conditions.join(' AND ')}
      ORDER BY e."startDateTime" ASC`,
    params
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

  // Buscar resultados submetidos
  let resultsByExam: Record<string, any[]> = {}
  if (examIds.length > 0) {
    const resultsRes = await query(
      `SELECT r."examId" AS examid, r."userId" AS userid, r.score,
              r."timeSpentSeconds" AS timespentseconds, r."submittedAt" AS submittedat,
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

  // Buscar provas de recuperação e seus resultados
  let recoveryExamsByOriginal: Record<string, any[]> = {}
  if (examIds.length > 0) {
    const recoveryExamsRes = await query(
      `SELECT id, "recoveryForExamId" AS recoveryforexamid
         FROM "Exam"
        WHERE "isRecovery" = true AND "recoveryForExamId" = ANY($1::text[])`,
      [examIds]
    )
    const recoveryExamIds = recoveryExamsRes.rows.map((r) => r.id)
    let recoveryResultsByRecoveryExam: Record<string, any[]> = {}
    if (recoveryExamIds.length > 0) {
      const recoveryResultsRes = await query(
        `SELECT "examId" AS examid, "userId" AS userid, score, "timeSpentSeconds" AS timespentseconds, "submittedAt" AS submittedat
           FROM "ExamResult"
          WHERE "examId" = ANY($1::text[])
            AND status IN ('SUBMITTED', 'AUTO_SUBMITTED')`,
        [recoveryExamIds]
      )
      for (const row of recoveryResultsRes.rows) {
        if (!recoveryResultsByRecoveryExam[row.examid]) recoveryResultsByRecoveryExam[row.examid] = []
        recoveryResultsByRecoveryExam[row.examid].push(row)
      }
    }
    for (const re of recoveryExamsRes.rows) {
      if (!recoveryExamsByOriginal[re.recoveryforexamid]) recoveryExamsByOriginal[re.recoveryforexamid] = []
      recoveryExamsByOriginal[re.recoveryforexamid].push({
        id: re.id,
        results: recoveryResultsByRecoveryExam[re.id] || [],
      })
    }
  }

  // Construir dados do relatório
  const examReports = examsRes.rows.map((exam) => {
    const recoveryByUser: Record<string, any> = {}
    for (const recExam of (recoveryExamsByOriginal[exam.id] || [])) {
      for (const recResult of recExam.results) {
        recoveryByUser[recResult.userid] = recResult
      }
    }

    const rows = (resultsByExam[exam.id] || []).map((r) => {
      const originalScore = r.score
      const recoveryResult = recoveryByUser[r.userid]
      const recoveryScore = recoveryResult?.score ?? null

      let mediaFinal: number
      let situacao: string
      let recoveryStatus: string

      if (originalScore >= NOTA_CORTE) {
        mediaFinal = originalScore
        situacao = 'Aprovado'
        recoveryStatus = '—'
      } else {
        if (recoveryScore !== null) {
          mediaFinal = recoveryScore
          situacao = recoveryScore >= NOTA_CORTE ? 'Aprovado' : 'Reprovado'
          recoveryStatus = 'Realizada'
        } else {
          mediaFinal = originalScore
          situacao = 'Reprovado'
          recoveryStatus = 'Pendente'
        }
      }

      const submittedDate = r.submittedat ? new Date(r.submittedat) : null
      const dataProva = submittedDate
        ? submittedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '—'
      const horario = submittedDate
        ? submittedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '—'
      const duracao = r.timespentseconds
        ? `${Math.floor(r.timespentseconds / 60)}min ${r.timespentseconds % 60}s`
        : '—'

      return {
        nome: r.username,
        cpf: r.usercpf,
        dataProva,
        horario,
        duracao,
        notaObtida: originalScore,
        notaRecuperacao: recoveryScore,
        recoveryStatus,
        mediaFinal: Math.round(mediaFinal * 100) / 100,
        situacao,
      }
    })

    const allFinalGrades = rows.map((r) => r.mediaFinal)
    const aprovados = rows.filter((r) => r.situacao === 'Aprovado').length
    const reprovados = rows.filter((r) => r.situacao === 'Reprovado').length
    const recuperacaoPendente = rows.filter((r) => r.recoveryStatus === 'Pendente').length

    return {
      title: exam.title,
      turmaName: exam.turmaname || 'Sem turma',
      subjectName: exam.subjectname || 'Multi',
      questionCount: questionCounts[exam.id] || 0,
      statistics: {
        media: allFinalGrades.length > 0 ? Math.round((allFinalGrades.reduce((a, b) => a + b, 0) / allFinalGrades.length) * 100) / 100 : 0,
        maior: allFinalGrades.length > 0 ? Math.max(...allFinalGrades) : 0,
        menor: allFinalGrades.length > 0 ? Math.min(...allFinalGrades) : 0,
      },
      aprovados,
      reprovados,
      recuperacaoPendente,
      rows,
    }
  })

  const turmaName = examsRes.rows[0]?.turmaname || 'Todas as turmas'

  const pdfBytes = await generateTurmaReportPdf({
    turmaName,
    notaCorte: NOTA_CORTE,
    exams: examReports,
  })

  const filename = `relatorio-${turmaName.replace(/\s+/g, '_')}.pdf`

  return new NextResponse(pdfBytes as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
