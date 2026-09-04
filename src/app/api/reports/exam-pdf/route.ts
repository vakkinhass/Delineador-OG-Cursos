import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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

  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: {
      turma: { select: { name: true } },
      subject: { select: { name: true } },
      questions: {
        orderBy: { order: 'asc' },
        include: { question: { include: { subject: { select: { name: true } } } } },
      },
    },
  })

  if (!exam) {
    return NextResponse.json({ error: 'Prova não encontrada.' }, { status: 404 })
  }

  const pdfBytes = await generateExamPdf(
    {
      title: exam.title,
      turmaName: exam.turma?.name || null,
      subjectName: exam.subject?.name || null,
      durationMinutes: exam.durationMinutes,
      startDateTime: exam.startDateTime.toISOString(),
      endDateTime: exam.endDateTime.toISOString(),
      totalQuestions: exam.questions.length,
      questions: exam.questions.map((eq, index) => ({
        index: index + 1,
        subjectName: eq.question.subject.name,
        statement: eq.question.statement,
        optionA: eq.question.optionA,
        optionB: eq.question.optionB,
        optionC: eq.question.optionC,
        optionD: eq.question.optionD,
        correctAnswer: withKey ? eq.question.correctAnswer : undefined,
        explanation: withKey ? eq.question.explanation || undefined : undefined,
      })),
    },
    withKey
  )

  const filename = withKey
    ? `prova-${exam.title.replace(/\s+/g, '_')}-gabarito.pdf`
    : `prova-${exam.title.replace(/\s+/g, '_')}.pdf`

  return new NextResponse(pdfBytes as Buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
