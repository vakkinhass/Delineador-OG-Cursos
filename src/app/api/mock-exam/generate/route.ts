import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { AnswerOption } from '@/lib/types'

// POST /api/mock-exam/generate
// Gera um simulado livre sob demanda.
// Body: { subjectIds?: string[], difficulty?: 'EASY'|'MEDIUM'|'HARD'|'ANY', count?: number }
// Retorna as questões SEM o gabarito (correctAnswer) para o aluno responder.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const subjectIds: string[] = body.subjectIds || []
    const difficulty: string = body.difficulty || 'EASY'
    const count: number = Math.min(Math.max(body.count || 10, 1), 50)

    // Construir filtros
    const where: { subjectId?: { in: string[] }; difficulty?: string } = {}
    if (subjectIds.length > 0) {
      where.subjectId = { in: subjectIds }
    }
    if (difficulty !== 'ANY') {
      where.difficulty = difficulty
    }

    // Buscar questões (buscamos mais do que o necessário para embaralhar)
    const allQuestions = await db.question.findMany({
      where,
      include: { subject: { select: { name: true } } },
      orderBy: { id: 'asc' },
    })

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma questão encontrada com os filtros selecionados.' },
        { status: 404 }
      )
    }

    // Embaralhar (Fisher-Yates) e selecionar
    const shuffled = [...allQuestions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    const selected = shuffled.slice(0, Math.min(count, shuffled.length))

    // Retornar SEM o gabarito
    const questions = selected.map((q, index) => ({
      id: q.id,
      index: index + 1,
      subjectId: q.subjectId,
      subjectName: q.subject.name,
      difficulty: q.difficulty,
      statement: q.statement,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
    }))

    return NextResponse.json({
      examId: `mock-${Date.now()}`,
      questions,
      totalQuestions: questions.length,
    })
  } catch (error) {
    console.error('Mock exam generate error:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar simulado.' },
      { status: 500 }
    )
  }
}

// POST /api/mock-exam/generate/grade
// Não usado - a correção é feita no submit abaixo
