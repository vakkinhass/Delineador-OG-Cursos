import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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
  const examWhere: { isRecovery: boolean; turmaId?: string } = { isRecovery: false }
  if (turmaId) examWhere.turmaId = turmaId

  const exams = await db.exam.findMany({
    where: examWhere,
    orderBy: { startDateTime: 'asc' },
    include: {
      turma: { select: { name: true } },
      subject: { select: { name: true } },
      _count: { select: { questions: true } },
      results: {
        where: { status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] } },
        include: { user: { select: { id: true, name: true, cpf: true } } },
      },
      recoveryExams: {
        include: {
          results: {
            where: { status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] } },
            select: { userId: true, score: true, timeSpentSeconds: true, submittedAt: true },
          },
        },
      },
    },
  })

  // Construir dados do relatório
  const examReports = exams.map((exam) => {
    const recoveryByUser: Record<string, any> = {}
    for (const recExam of exam.recoveryExams) {
      for (const recResult of recExam.results) {
        recoveryByUser[recResult.userId] = recResult
      }
    }

    const rows = exam.results.map((r) => {
      const originalScore = r.score
      const recoveryResult = recoveryByUser[r.userId]
      const recoveryScore = recoveryResult?.score ?? null

      let mediaFinal: number
      let situacao: string
      let recoveryStatus: string

      if (originalScore >= NOTA_CORTE) {
        // Aprovado direto (nota >= 6,0)
        mediaFinal = originalScore
        situacao = 'Aprovado'
        recoveryStatus = '—'
      } else {
        // Reprovado na prova original - vai para recuperação
        if (recoveryScore !== null) {
          // Recuperação realizada: a nota final = nota da recuperação
          // Se passar na recuperação (>= 6,0), está aprovado
          mediaFinal = recoveryScore
          situacao = recoveryScore >= NOTA_CORTE ? 'Aprovado' : 'Reprovado'
          recoveryStatus = 'Realizada'
        } else {
          // Recuperação disponível mas não realizada ainda
          mediaFinal = originalScore
          situacao = 'Reprovado'
          recoveryStatus = 'Pendente'
        }
      }

      const submittedDate = r.submittedAt ? new Date(r.submittedAt) : null
      const dataProva = submittedDate
        ? submittedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '—'
      const horario = submittedDate
        ? submittedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '—'
      const duracao = r.timeSpentSeconds
        ? `${Math.floor(r.timeSpentSeconds / 60)}min ${r.timeSpentSeconds % 60}s`
        : '—'

      return {
        nome: r.user.name,
        cpf: r.user.cpf,
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
      turmaName: exam.turma?.name || 'Sem turma',
      subjectName: exam.subject?.name || 'Multi',
      questionCount: exam._count.questions,
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

  const turmaName = exams[0]?.turma?.name || 'Todas as turmas'

  const pdfBytes = await generateTurmaReportPdf({
    turmaName,
    notaCorte: NOTA_CORTE,
    exams: examReports,
  })

  const filename = `relatorio-${turmaName.replace(/\s+/g, '_')}.pdf`

  return new NextResponse(pdfBytes as Buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
