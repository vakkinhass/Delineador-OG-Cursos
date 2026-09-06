import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// POST /api/exams/[id]/assign
// Agenda uma prova para um aluno específico (prova antecipada/individual).
// Permite definir data/hora de início e fim E duração personalizadas.
// Body: { userId, startDateTime, endDateTime, durationMinutes? }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const userId = String(body.userId || '').trim()
    const startDateTime = new Date(body.startDateTime)
    const endDateTime = new Date(body.endDateTime)
    const durationMinutes = body.durationMinutes ? parseInt(body.durationMinutes, 10) : null

    if (!userId || isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return NextResponse.json({ error: 'Aluno, data de início e fim são obrigatórios.' }, { status: 400 })
    }

    if (endDateTime <= startDateTime) {
      return NextResponse.json({ error: 'Data/hora de término deve ser posterior à de início.' }, { status: 400 })
    }

    // Verificar se a prova e o aluno existem
    const exam = await db.exam.findUnique({ where: { id } })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada.' }, { status: 404 })
    }

    const student = await db.user.findUnique({ where: { id: userId } })
    if (!student) {
      return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 })
    }

    if (student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'O usuário selecionado não é um aluno.' }, { status: 400 })
    }

    // Criar ou atualizar atribuição
    const assignment = await db.examAssignment.upsert({
      where: { examId_userId: { examId: id, userId } },
      update: {
        startDateTime,
        endDateTime,
        durationMinutes: durationMinutes || exam.durationMinutes,
      },
      create: {
        examId: id,
        userId,
        startDateTime,
        endDateTime,
        durationMinutes: durationMinutes || exam.durationMinutes,
      },
      include: { user: { select: { name: true, cpf: true } } },
    })

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        userId: assignment.userId,
        userName: assignment.user.name,
        userCpf: assignment.user.cpf,
        startDateTime: assignment.startDateTime.toISOString(),
        endDateTime: assignment.endDateTime.toISOString(),
        durationMinutes: assignment.durationMinutes,
      },
    })
  } catch (error) {
    console.error('Assign exam error:', error)
    return NextResponse.json({ error: 'Erro ao agendar prova para aluno.' }, { status: 500 })
  }
}

// DELETE /api/exams/[id]/assign - Remove agendamento individual
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 })
  }

  try {
    await db.examAssignment.delete({
      where: { examId_userId: { examId: id, userId } },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete assignment error:', error)
    return NextResponse.json({ error: 'Erro ao remover agendamento.' }, { status: 500 })
  }
}
