import { NextRequest, NextResponse } from 'next/server'
import { query, generateId } from '@/lib/db-pg'
import { getCurrentUser } from '@/lib/auth'

// Nota de corte da escola: 6,0 (60%)
const NOTA_CORTE = 60

// POST /api/exams/[id]/submit
// Submete a prova: corrige, calcula score e salva resultado.
// Se a nota for < 6.0 (60%) e a prova NÃO for recuperação,
// libera automaticamente uma prova de recuperação para o aluno.
// Body: { answers: { questionId: 'A'|'B'|'C'|'D' }, autoSubmitted?: boolean }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const answers = body.answers || {}
    const autoSubmitted = body.autoSubmitted === true

    const resultRes = await query(
      `SELECT id, answers, status, "startedAt" AS startedat
         FROM "ExamResult"
        WHERE "examId" = $1 AND "userId" = $2`,
      [id, user.id]
    )
    const result = resultRes.rows[0]

    if (!result) {
      return NextResponse.json({ error: 'Prova não iniciada.' }, { status: 400 })
    }

    if (result.status === 'SUBMITTED' || result.status === 'AUTO_SUBMITTED') {
      return NextResponse.json({ error: 'Prova já finalizada.', resultId: result.id }, { status: 400 })
    }

    // Buscar questões da prova com gabarito
    const examQuestionsRes = await query(
      `SELECT eq."questionId" AS questionid, eq."order" AS order_num, q."correctAnswer" AS correctanswer
         FROM "ExamQuestion" eq
         JOIN "Question" q ON q.id = eq."questionId"
        WHERE eq."examId" = $1
        ORDER BY eq."order" ASC`,
      [id]
    )
    const examQuestions = examQuestionsRes.rows

    // Buscar a prova para verificar se é de recuperação
    const examRes = await query(
      `SELECT "isRecovery" AS isrecovery, "recoveryForExamId" AS recoveryforexamid,
              title, "durationMinutes" AS durationminutes, "subjectId" AS subjectid
         FROM "Exam" WHERE id = $1`,
      [id]
    )
    const exam = examRes.rows[0]

    // Mesclar respostas salvas com as enviadas (as enviadas têm prioridade)
    let savedAnswers = {}
    if (result.answers) {
      try { savedAnswers = JSON.parse(result.answers) } catch { savedAnswers = {} }
    }
    const finalAnswers = { ...savedAnswers, ...answers }

    let correctCount = 0
    for (const eq of examQuestions) {
      const userAnswer = finalAnswers[eq.questionid]
      if (userAnswer && userAnswer === eq.correctanswer) {
        correctCount++
      }
    }

    const totalQuestions = examQuestions.length
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0
    const roundedScore = Math.round(score * 100) / 100

    // Calcular tempo gasto
    const now = new Date()
    const startedAt = result.startedat ? new Date(result.startedat) : now
    const timeSpentSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000)

    const finalStatus = autoSubmitted ? 'AUTO_SUBMITTED' : 'SUBMITTED'
    await query(
      `UPDATE "ExamResult"
          SET answers = $1, score = $2, "correctCount" = $3,
              "totalQuestions" = $4, "timeSpentSeconds" = $5,
              status = $6, "submittedAt" = $7, "updatedAt" = NOW()
        WHERE id = $8`,
      [JSON.stringify(finalAnswers), roundedScore, correctCount,
       totalQuestions, timeSpentSeconds, finalStatus, now, result.id]
    )

    // ============================================================
    // LÓGICA DE RECUPERAÇÃO AUTOMÁTICA
    // Se nota < 6.0 (60%) e NÃO é prova de recuperação, libera recuperação
    // ============================================================
    let recoveryReleased = false
    const isRecovery = exam?.isrecovery === true

    if (!isRecovery && roundedScore < NOTA_CORTE) {
      // Verificar se já existe uma prova de recuperação para esta prova
      const existingRecoveryRes = await query(
        `SELECT id FROM "Exam" WHERE "recoveryForExamId" = $1 LIMIT 1`,
        [id]
      )
      let recoveryExamId: string

      if (existingRecoveryRes.rows.length === 0) {
        // Criar a prova de recuperação (cópia da original)
        recoveryExamId = generateId()
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        await query(
          `INSERT INTO "Exam" (id, title, description, "turmaId", "subjectId",
               "startDateTime", "endDateTime", "durationMinutes", active,
               "isRecovery", "recoveryForExamId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, NULL, $4, $5, $6, $7, true, true, $8, NOW(), NOW())`,
          [
            recoveryExamId,
            `${exam?.title || 'Prova'} - Recuperação`,
            'Prova de recuperação liberada automaticamente',
            exam?.subjectid || null,
            now,
            sevenDaysLater,
            exam?.durationminutes || 60,
            id,
          ]
        )

        // Copiar questões
        for (let i = 0; i < examQuestions.length; i++) {
          await query(
            `INSERT INTO "ExamQuestion" (id, "examId", "questionId", "order")
             VALUES ($1, $2, $3, $4)`,
            [generateId(), recoveryExamId, examQuestions[i].questionid, i]
          )
        }
      } else {
        recoveryExamId = existingRecoveryRes.rows[0].id
      }

      // Verificar se já existe agendamento de recuperação para este aluno
      const existingAssignmentRes = await query(
        `SELECT id FROM "ExamAssignment"
          WHERE "examId" = $1 AND "userId" = $2`,
        [recoveryExamId, user.id]
      )

      if (existingAssignmentRes.rows.length === 0) {
        // Liberar a recuperação imediatamente para o aluno
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        await query(
          `INSERT INTO "ExamAssignment" (id, "examId", "userId",
              "startDateTime", "endDateTime", "durationMinutes", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            generateId(),
            recoveryExamId,
            user.id,
            now,
            sevenDaysLater,
            exam?.durationminutes || 60,
          ]
        )
        recoveryReleased = true
      }
    }

    return NextResponse.json({
      success: true,
      resultId: result.id,
      score: roundedScore,
      correctCount,
      totalQuestions,
      timeSpentSeconds,
      status: finalStatus,
      autoSubmitted,
      notaCorte: NOTA_CORTE,
      aprovado: roundedScore >= NOTA_CORTE,
      recoveryReleased,
      isRecovery,
    })
  } catch (error) {
    console.error('Submit exam error:', error)
    return NextResponse.json({ error: 'Erro ao submeter prova.' }, { status: 500 })
  }
}
