import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/subjects - Lista disciplinas com contagem de questões
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const subjects = await db.subject.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { questions: true } },
    },
  })

  return NextResponse.json({
    subjects: subjects.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      questionCount: s._count.questions,
    })),
  })
}
