import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { requireAdmin } from '@/lib/auth'
import { generateExamPdf } from '@/lib/pdf-generator'

// GET /api/reports/exam-pdf?id=xxx&withKey=true|false
// Gera o PDF da prova para impressão (com ou sem gabarito).
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const examId = searchParams.get('id')
  const withKey = searchParams.get('withKey') === 'true'

  if (!examId) {
    return NextResponse.json({ error: 'ID da prova é obrigatório.' }, { status: 400 })
  }

  const examRes = await query(
    `SELECT e.id, e.title, e."durationMinutes" AS durationminutes,
            e."startDateTime" AS startdatetime, e."endDateTime" AS enddatetime,
            t.name AS turmaname, s.name AS subjectname
       FROM "Exam" e
       LEFT JOIN "Turma" t ON t.id = e."turmaId"
       LEFT JOIN "Subject" s ON s.id = e."subjectId"
      WHERE e.id = $1`,
    [examId]
  )
  const exam = examRes.rows[0]

  if (!exam) {
    return NextResponse.json({ error: 'Prova não encontrada.' }, { status: 404 })
  }

  const questionsRes = await query(
    `SELECT q.statement, q."optionA", q."optionB", q."optionC", q."optionD",
            q."correctAnswer" AS correctanswer, q.explanation,
            s.name AS subjectname, eq."order" AS order_num
       FROM "ExamQuestion" eq
       JOIN "Question" q ON q.id = eq."questionId"
       LEFT JOIN "Subject" s ON s.id = q."subjectId"
      WHERE eq."examId" = $1
      ORDER BY eq."order" ASC`,
    [examId]
  )

  const pdfBytes = await generateExamPdf(
    {
      title: exam.title,
      turmaName: exam.turmaname || null,
      subjectName: exam.subjectname || null,
      durationMinutes: exam.durationminutes,
      startDateTime: new Date(exam.startdatetime).toISOString(),
      endDateTime: new Date(exam.enddatetime).toISOString(),
      totalQuestions: questionsRes.rows.length,
      questions: questionsRes.rows.map((q, index) => ({
        index: index + 1,
        subjectName: q.subjectname,
        statement: q.statement,
        optionA: q.optiona,
        optionB: q.optionb,
        optionC: q.optionc,
        optionD: q.optiond,
        correctAnswer: withKey ? q.correctanswer : undefined,
        explanation: withKey ? q.explanation || undefined : undefined,
      })),
    },
    withKey
  )

  const filename = withKey
    ? `prova-${exam.title.replace(/\s+/g, '_')}-gabarito.pdf`
    : `prova-${exam.title.replace(/\s+/g, '_')}.pdf`

  return new NextResponse(pdfBytes as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
