import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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

    // Buscar usuário pelo CPF (com máscara)
    const user = await db.user.findUnique({
      where: { cpf: maskedCpf },
      select: {
        id: true,
        cpf: true,
        name: true,
        role: true,
        active: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'CPF não cadastrado. Procure o administrador.' },
        { status: 404 }
      )
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'Acesso bloqueado. Contate o administrador.' },
        { status: 403 }
      )
    }

    await createSession(user)

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
