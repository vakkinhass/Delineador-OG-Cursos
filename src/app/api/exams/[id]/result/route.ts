import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { getCurrentUser } from '@/lib/auth'

// GET /api/exams/[id]/result
// Retorna o resultado da prova com gabarito comentado.
// Aluno vê apenas o seu resultado. Admin vê qualquer resultado (opcional ?userId=).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const targetUserId = user.role === 'ADMIN' ? (searchParams.get('userId') || user.id) : user.id

  // Buscar resultado
  const resultRes = await query(
    `SELECT r.id, r."examId" AS examid, r.answers, r.score,
            r."correctCount" AS correctcount, r."totalQuestions" AS totalquestions,
            r."timeSpentSeconds" AS timespentseconds, r.status,
            r."startedAt" AS startedat, r."submittedAt" AS submittedat,
            e.title AS examtitle,
            u.name AS username, u.cpf AS usercpf
       FROM "ExamResult" r
       JOIN "Exam" e ON e.id = r."examId"
       JOIN "User" u ON u.id = r."userId"
      WHERE r."examId" = $1 AND r."userId" = $2`,
    [id, targetUserId]
  )

  const result = resultRes.rows[0]
  if (!result) {
    return NextResponse.json({ error: 'Resultado não encontrado.' }, { status: 404 })
  }

  // Buscar questões da prova com gabarito
  const questionsRes = await query(
    `SELECT q.id, q.statement, q."optionA" AS optiona, q."optionB" AS optionb, q."optionC" AS optionc, q."optionD" AS optiond,
            q."correctAnswer" AS correctanswer, q.explanation,
            s.name AS subjectname, eq."order" AS order_num
       FROM "ExamQuestion" eq
       JOIN "Question" q ON q.id = eq."questionId"
       LEFT JOIN "Subject" s ON s.id = q."subjectId"
      WHERE eq."examId" = $1
      ORDER BY eq."order" ASC`,
    [id]
  )

  let answers = {}
  if (result.answers) {
    try { answers = JSON.parse(result.answers) } catch { answers = {} }
  }

  return NextResponse.json({
    result: {
      id: result.id,
      examId: result.examid,
      examTitle: result.examtitle,
      userName: result.username,
      userCpf: result.usercpf,
      score: result.score,
      correctCount: result.correctcount,
      totalQuestions: result.totalquestions,
      timeSpentSeconds: result.timespentseconds,
      status: result.status,
      startedAt: result.startedat ? new Date(result.startedat).toISOString() : null,
      submittedAt: result.submittedat ? new Date(result.submittedat).toISOString() : null,
    },
    questions: questionsRes.rows.map((q, index) => {
      const userAnswer = answers[q.id] || null
      return {
        id: q.id,
        index: index + 1,
        subjectName: q.subjectname,
        statement: q.statement,
        optionA: q.optiona,
        optionB: q.optionb,
        optionC: q.optionc,
        optionD: q.optiond,
        correctAnswer: q.correctanswer,
        userAnswer,
        isCorrect: userAnswer === q.correctanswer,
        explanation: q.explanation,
      }
    }),
  })
}
