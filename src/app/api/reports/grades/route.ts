import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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
  const examWhere = turmaId ? { turmaId } : {}
  const exams = await db.exam.findMany({
    where: examWhere,
    orderBy: { startDateTime: 'desc' },
    include: {
      turma: { select: { name: true } },
      subject: { select: { name: true } },
      _count: { select: { questions: true } },
      results: {
        include: {
          user: {
            select: { id: true, name: true, cpf: true, turmas: { include: { turma: { select: { name: true } } } } },
          },
        },
      },
    },
  })

  // Buscar alunos da turma (para listar mesmo os que não fizeram prova)
  let students: { id: string; name: string; cpf: string }[] = []
  if (turmaId) {
    const userTurmas = await db.userTurma.findMany({
      where: { turmaId },
      include: { user: { select: { id: true, name: true, cpf: true } } },
    })
    students = userTurmas.map((ut) => ({
      id: ut.user.id,
      name: ut.user.name,
      cpf: ut.user.cpf,
    }))
  }

  // Construir relatório por prova
  const examReports = exams.map((exam) => {
    const submittedResults = exam.results.filter(
      (r) => r.status === 'SUBMITTED' || r.status === 'AUTO_SUBMITTED'
    )
    const scores = submittedResults.map((r) => r.score)
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const max = scores.length > 0 ? Math.max(...scores) : 0
    const min = scores.length > 0 ? Math.min(...scores) : 0

    return {
      examId: exam.id,
      title: exam.title,
      turmaName: exam.turma?.name || 'Sem turma',
      subjectName: exam.subject?.name || 'Multi',
      startDateTime: exam.startDateTime.toISOString(),
      questionCount: exam._count.questions,
      totalStudents: students.length || submittedResults.length,
      submittedCount: submittedResults.length,
      statistics: {
        average: Math.round(avg * 100) / 100,
        highest: Math.round(max * 100) / 100,
        lowest: Math.round(min * 100) / 100,
      },
      results: submittedResults.map((r) => ({
        userId: r.user.id,
        userName: r.user.name,
        userCpf: r.user.cpf,
        score: r.score,
        correctCount: r.correctCount,
        totalQuestions: r.totalQuestions,
        timeSpentSeconds: r.timeSpentSeconds,
        status: r.status,
        submittedAt: r.submittedAt?.toISOString() || null,
      })),
    }
  })

  // Estatísticas gerais da turma (todas as provas)
  const allScores = examReports.flatMap((e) => e.results.map((r) => r.score))
  const generalStats = {
    totalExams: exams.length,
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
