import { NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { getCurrentUser } from '@/lib/auth'

// GET /api/subjects - Lista disciplinas com contagem de questões
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const res = await query(
    `SELECT s.id, s.name, s.description,
            (SELECT COUNT(*)::int FROM "Question" q WHERE q."subjectId" = s.id) AS "questionCount"
       FROM "Subject" s
      ORDER BY s.name ASC`
  )

  return NextResponse.json({
    subjects: res.rows.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      questionCount: s.questionCount,
    })),
  })
}
