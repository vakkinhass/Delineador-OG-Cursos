import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-pg'
import { createSession, sanitizeCpf, maskCpf, isValidCpfFormat } from '@/lib/auth'

// POST /api/auth/login - Login por CPF (único campo)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawCpf = String(body?.cpf || '').trim()
    const cpf = sanitizeCpf(rawCpf)

    if (!isValidCpfFormat(cpf)) {
      return NextResponse.json(
        { error: 'CPF inválido. Informe 11 dígitos.' },
        { status: 400 }
      )
    }

    const maskedCpf = maskCpf(cpf)

    const res = await query(
      'SELECT id, cpf, name, role, active FROM "User" WHERE cpf = $1',
      [maskedCpf]
    )

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'CPF não cadastrado. Procure o administrador.' },
        { status: 404 }
      )
    }

    const user = res.rows[0]
    if (!user.active) {
      return NextResponse.json(
        { error: 'Acesso bloqueado. Contate o administrador.' },
        { status: 403 }
      )
    }

    await createSession({
      id: user.id,
      cpf: user.cpf,
      name: user.name,
      role: user.role,
      active: user.active,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        cpf: user.cpf,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erro interno no login.' },
      { status: 500 }
    )
  }
}
